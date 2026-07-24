import type { SupabaseClient } from "@supabase/supabase-js";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { listInboxRepliesViaConnection } from "@/lib/mailboxConnections";
import type { InboundMessage } from "@/lib/integrations/email/types";

const POLL_LOOKBACK_HOURS = 6; // poll cadence (5h) + buffer; overlap is harmless, dedupe is per-lead via last_reply_message_id

/**
 * First cron-triggered Inngest function in this codebase — every other job
 * here is event-triggered. Sweeps every connected mailbox for new replies
 * on threads Oliver actually sent through the app (matched via
 * `conversation_id`), and hands genuine ones off to `draftReplyOnReceipt`.
 * Runs one mailbox at a time so a single founder's expired/revoked token
 * can't block the rest of the sweep.
 *
 * KNOWN LIMIT: no pagination over `mailbox_connections` — fine at current
 * scale, revisit if the founder base grows past what one run can sweep.
 */
export const pollForReplies = inngest.createFunction(
  { id: "poll-for-replies", triggers: [{ cron: "0 */5 * * *" }] },
  async ({ step }) => {
    const supabase = createAdminClient();

    const { data: connections } = await supabase
      .from("mailbox_connections")
      .select("user_id");

    for (const connection of (connections as { user_id: string }[] | null) ??
      []) {
      const userId = connection.user_id;

      await step.run(`poll-mailbox-${userId}`, async () => {
        try {
          await pollOneMailbox(supabase, userId);
        } catch (error) {
          console.error(`pollForReplies: failed for user ${userId}`, error);
        }
      });
    }

    return { status: "completed" };
  },
);

async function pollOneMailbox(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const since = new Date(
    Date.now() - POLL_LOOKBACK_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const messages = await listInboxRepliesViaConnection(supabase, userId, {
    since,
  });
  if (messages.length === 0) return;

  // Only the newest inbound message per thread matters for this tick —
  // dedupe/ordering below is against last_reply_message_id, one at a time.
  const newestByConversation = new Map<string, InboundMessage>();
  for (const message of messages) {
    const current = newestByConversation.get(message.conversationId);
    if (!current || message.receivedAt > current.receivedAt) {
      newestByConversation.set(message.conversationId, message);
    }
  }
  const conversationIds = [...newestByConversation.keys()];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, conversation_id, last_reply_message_id, reply_status")
    .eq("user_id", userId)
    .eq("send_status", "sent")
    .in("conversation_id", conversationIds)
    .or("reply_status.is.null,reply_status.eq.rejected");

  for (const lead of (leads as
    | {
        id: string;
        conversation_id: string;
        last_reply_message_id: string | null;
        reply_status: string | null;
      }[]
    | null) ?? []) {
    const message = newestByConversation.get(lead.conversation_id);
    if (!message || message.id === lead.last_reply_message_id) continue;

    if (!message.isAutomated) {
      await inngest.send({
        name: "leads/reply-received",
        data: {
          userId,
          leadId: lead.id,
          messageId: message.id,
          from: message.from,
          snippet: message.body.slice(0, 500),
          body: message.body.slice(0, 4000),
        },
      });
    }

    // Update the dedupe marker regardless of whether this was a genuine
    // reply or filtered junk — an auto-reply we've already seen shouldn't
    // be re-evaluated (and re-logged) on every future tick either.
    await supabase
      .from("leads")
      .update({
        last_reply_message_id: message.id,
        last_reply_snippet: message.body.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);
  }
}
