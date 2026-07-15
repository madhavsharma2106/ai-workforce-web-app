import type { ModelMessage } from "ai";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEmployees, ROLE_LABELS } from "@/lib/employees";
import { insertDelegation } from "@/lib/agentRuns";
import { runGraphJob } from "@/lib/agents/runGraphJob";

/**
 * Founder-triggered handoff: approving a lead on Emma's page starts a real
 * drafting run for Oliver. Distinct from `employee/run.requested` (a
 * free-text debug entry point) because this needs to seed a specific lead's
 * research and link a `delegations` row, not just pass a message. See
 * docs/AGENTS.md.
 */
export const draftOutreachOnApproval = inngest.createFunction(
  { id: "draft-outreach-on-approval", triggers: [{ event: "leads/approved" }] },
  async ({ event, step }) => {
    const { userId, leadId } = event.data as { userId: string; leadId: string };
    const supabase = createAdminClient();

    await step.run("delegate-and-draft", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select(
          "id, employee_id, run_id, company, website, fit, decision_maker, sources, status, draft",
        )
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Idempotency backstop: only proceed for a still-approved, not-yet-
      // drafted lead. Guards against a duplicate/retried event.
      if (!lead || lead.status !== "approved" || lead.draft !== "") return;

      const employees = await listEmployees(supabase, userId);
      const oliver = employees.find((e) => e.role === "sales_representative");
      // Backstop only — the PATCH route already blocks approval when Oliver
      // isn't hired, so this should be unreachable in practice.
      if (!oliver) return;

      const delegation = await insertDelegation(supabase, {
        userId,
        fromEmployeeId: lead.employee_id,
        toRole: "sales_representative",
        toEmployeeId: oliver.id,
        fromRunId: lead.run_id,
        reason: `Approved lead ready for outreach: ${lead.company}`,
        context: { leadId: lead.id },
      });

      const handoffMessage: ModelMessage = {
        role: "user",
        content: `[Handed off from ${ROLE_LABELS.lead_sourcer}] ${lead.company} was approved for outreach. Fit: ${lead.fit}. Decision maker: ${lead.decision_maker}. Website: ${lead.website}. Sources: ${lead.sources}. Draft a personalized outreach email now.`,
      };

      await runGraphJob(supabase, {
        userId,
        initiatingRole: "sales_representative",
        messages: [handoffMessage],
        leadId: lead.id,
        pendingDelegationId: delegation.id,
      });
    });

    return { status: "completed" };
  },
);
