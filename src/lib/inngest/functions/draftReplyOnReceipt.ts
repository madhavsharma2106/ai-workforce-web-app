import type { ModelMessage } from "ai";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEmployees } from "@/lib/employees";
import { insertDelegation } from "@/lib/agentRuns";
import { runGraphJob } from "@/lib/agents/runGraphJob";

/**
 * Poll-triggered handoff: `pollForReplies` detects a genuine (non-automated)
 * reply on a thread Oliver sent and fires this. Mirrors
 * draftOutreachOnApproval.ts's shape — self-delegation (Oliver to Oliver)
 * since there's no other employee involved in handling a reply, unlike the
 * Emma-to-Oliver outreach handoff. Uses the lead's original `draft_run_id`
 * as the delegation's `fromRunId` since that's the most recent real Oliver
 * run tied to this lead.
 */
export const draftReplyOnReceipt = inngest.createFunction(
  {
    id: "draft-reply-on-receipt",
    triggers: [{ event: "leads/reply-received" }],
  },
  async ({ event, step }) => {
    const { userId, leadId, from, body } = event.data as {
      userId: string;
      leadId: string;
      messageId: string;
      from: string;
      snippet: string;
      body: string;
    };
    const supabase = createAdminClient();

    await step.run("delegate-and-draft-reply", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, company, draft_run_id, reply_status")
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Idempotency backstop: don't start a second reply-drafting run while
      // one is already pending/approved for this lead.
      if (
        !lead ||
        !lead.draft_run_id ||
        lead.reply_status === "pending" ||
        lead.reply_status === "approved"
      )
        return;

      const employees = await listEmployees(supabase, userId);
      const oliver = employees.find((e) => e.role === "sales_representative");
      if (!oliver) return;

      const delegation = await insertDelegation(supabase, {
        userId,
        fromEmployeeId: oliver.id,
        toRole: "sales_representative",
        toEmployeeId: oliver.id,
        fromRunId: lead.draft_run_id,
        reason: `New reply from ${lead.company}`,
        context: { leadId: lead.id },
      });

      const handoffMessage: ModelMessage = {
        role: "user",
        content: `${lead.company} replied to your outreach. From: ${from}. Message: "${body}". Draft a personalized reply now.`,
      };

      await runGraphJob(supabase, {
        userId,
        initiatingRole: "sales_representative",
        messages: [handoffMessage],
        leadId: lead.id,
        jobKind: "reply",
        pendingDelegationId: delegation.id,
      });
    });

    return { status: "completed" };
  },
);
