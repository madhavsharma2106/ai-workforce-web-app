import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReplyViaConnection } from "@/lib/mailboxConnections";

/**
 * Founder-triggered send: approving a reply draft fires this, mirroring
 * sendOutreachOnApproval.ts's shape. Sends via Graph's /reply on the
 * inbound message id (last_reply_message_id) rather than a fresh sendMail,
 * so the response stays threaded. On success, resets `reply_status` back to
 * null (not left at "approved") so a later reply on the same thread can be
 * drafted and approved again — the outreach flow doesn't need this since a
 * lead is only ever sent once, but a conversation can have many replies.
 */
export const sendReplyOnApproval = inngest.createFunction(
  {
    id: "send-reply-on-approval",
    triggers: [{ event: "leads/reply-send-requested" }],
  },
  async ({ event, step }) => {
    const { userId, leadId } = event.data as { userId: string; leadId: string };
    const supabase = createAdminClient();

    await step.run("send-reply", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select(
          "id, last_reply_message_id, reply_draft, reply_status, reply_send_status",
        )
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Idempotency backstop: only proceed for a still-approved, not-yet-sent reply.
      if (
        !lead ||
        !lead.last_reply_message_id ||
        lead.reply_status !== "approved" ||
        lead.reply_send_status === "sent"
      )
        return;

      await supabase
        .from("leads")
        .update({ reply_send_status: "sending" })
        .eq("id", leadId);

      try {
        await sendReplyViaConnection(supabase, userId, {
          messageId: lead.last_reply_message_id,
          body: lead.reply_draft,
        });
        await supabase
          .from("leads")
          .update({
            reply_send_status: "sent",
            reply_sent_at: new Date().toISOString(),
            reply_send_error: null,
            reply_status: null,
          })
          .eq("id", leadId);
      } catch (error) {
        await supabase
          .from("leads")
          .update({
            reply_send_status: "failed",
            reply_send_error:
              error instanceof Error
                ? error.message
                : "Unknown error sending reply.",
          })
          .eq("id", leadId);
      }
    });

    return { status: "completed" };
  },
);
