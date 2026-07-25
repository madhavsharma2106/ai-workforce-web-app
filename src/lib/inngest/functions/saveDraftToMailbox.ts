import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveDraftViaConnection } from "@/lib/mailboxConnections";
import { log } from "@/lib/log";

/**
 * Founder-triggered: clicking "Save to Drafts" pushes the current draft into
 * the founder's real mailbox Drafts folder, independent of the send flow
 * (draft_status doesn't change) — mirrors sendOutreachOnApproval.ts's shape.
 */
export const saveDraftToMailbox = inngest.createFunction(
  {
    id: "save-draft-to-mailbox",
    triggers: [{ event: "leads/save-draft-requested" }],
  },
  async ({ event, step }) => {
    const { userId, leadId } = event.data as { userId: string; leadId: string };
    const supabase = createAdminClient();

    log.info("inngest job started", {
      job: "save-draft-to-mailbox",
      userId,
      leadId,
    });

    const outcome = await step.run("save-draft", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, email, subject, draft, draft_save_status")
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Idempotency backstop: don't re-save a lead that already made it in.
      if (!lead || lead.draft_save_status === "saved")
        return "skipped: already saved";

      await supabase
        .from("leads")
        .update({ draft_save_status: "saving" })
        .eq("id", leadId);

      try {
        await saveDraftViaConnection(supabase, userId, {
          to: lead.email,
          subject: lead.subject,
          body: lead.draft,
        });
        await supabase
          .from("leads")
          .update({
            draft_save_status: "saved",
            draft_saved_at: new Date().toISOString(),
            draft_save_error: null,
          })
          .eq("id", leadId);
        return "saved";
      } catch (error) {
        await supabase
          .from("leads")
          .update({
            draft_save_status: "failed",
            draft_save_error:
              error instanceof Error
                ? error.message
                : "Unknown error saving draft.",
          })
          .eq("id", leadId);
        return "failed";
      }
    });

    log.info("inngest job finished", {
      job: "save-draft-to-mailbox",
      userId,
      leadId,
      outcome,
    });

    return { status: "completed" };
  },
);
