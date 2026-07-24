import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendViaConnection } from "@/lib/mailboxConnections";

/**
 * Founder-triggered send: clicking "Send as you" on an approved draft fires
 * this, mirroring draftOutreachOnApproval.ts's shape. Distinct from that
 * function because it's a different trigger (draft approval, not lead
 * approval) — conflating them would make one job do two unrelated things.
 */
export const sendOutreachOnApproval = inngest.createFunction(
  {
    id: "send-outreach-on-approval",
    triggers: [{ event: "leads/send-requested" }],
  },
  async ({ event, step }) => {
    const { userId, leadId } = event.data as { userId: string; leadId: string };
    const supabase = createAdminClient();

    await step.run("send-mail", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, email, subject, draft, draft_status, send_status")
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Idempotency backstop: only proceed for a still-approved, not-yet-sent lead.
      if (
        !lead ||
        lead.draft_status !== "approved" ||
        lead.send_status === "sent"
      )
        return;

      await supabase
        .from("leads")
        .update({ send_status: "sending" })
        .eq("id", leadId);

      try {
        await sendViaConnection(supabase, userId, {
          to: lead.email,
          subject: lead.subject,
          body: lead.draft,
        });
        await supabase
          .from("leads")
          .update({
            send_status: "sent",
            sent_at: new Date().toISOString(),
            send_error: null,
          })
          .eq("id", leadId);
      } catch (error) {
        await supabase
          .from("leads")
          .update({
            send_status: "failed",
            send_error:
              error instanceof Error
                ? error.message
                : "Unknown error sending email.",
          })
          .eq("id", leadId);
      }
    });

    return { status: "completed" };
  },
);
