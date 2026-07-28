import type { ModelMessage } from "ai";
import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { listEmployees } from "@/lib/employees";
import { insertDelegation } from "@/lib/agentRuns";
import { updateLeadRedraftStatus } from "@/lib/leads";
import { runGraphJob } from "@/lib/agents/runGraphJob";
import { log } from "@/lib/log";

/**
 * Founder-triggered, per-email redraft: from Oliver's dashboard, the founder
 * can ask Oliver to regenerate a single draft still awaiting their approval,
 * optionally with a free-text amendment ("make it shorter", "mention the
 * funding round"). Mirrors `draftOutreachOnApproval`'s delegate-and-draft
 * shape, but re-invoked on a lead that already has a draft rather than an
 * empty one — see `src/app/api/leads/[id]/redraft/route.ts`, which sets
 * `redraft_status = 'redrafting'` before firing this event.
 */
export const redraftOutreach = inngest.createFunction(
  { id: "redraft-outreach", triggers: [{ event: "leads/redraft-requested" }] },
  async ({ event, step }) => {
    const { userId, leadId, message } = event.data as {
      userId: string;
      leadId: string;
      message?: string;
    };
    const supabase = createAdminClient();

    log.info("inngest job started", {
      job: "redraft-outreach",
      userId,
      leadId,
    });

    const outcome = await step.run("redraft", async () => {
      const { data: lead } = await supabase
        .from("leads")
        .select(
          "id, employee_id, run_id, company, website, fit, decision_maker, sources, draft_status, redraft_status",
        )
        .eq("id", leadId)
        .eq("user_id", userId)
        .maybeSingle();

      // Guards against a stale/duplicate event, and against the founder
      // having approved or rejected this lead's draft while the redraft
      // was queued — never silently overwrite or resurrect that decision.
      if (
        !lead ||
        lead.draft_status !== "pending" ||
        lead.redraft_status !== "redrafting"
      ) {
        if (lead && lead.redraft_status === "redrafting") {
          await updateLeadRedraftStatus(supabase, {
            id: leadId,
            userId,
            status: null,
          });
        }
        return "skipped: lead not awaiting a redraft";
      }

      const employees = await listEmployees(supabase, userId);
      const oliver = employees.find((e) => e.role === "sales_representative");
      if (!oliver) return "skipped: sales_representative not hired";

      const delegation = await insertDelegation(supabase, {
        userId,
        fromEmployeeId: lead.employee_id,
        toRole: "sales_representative",
        toEmployeeId: oliver.id,
        fromRunId: lead.run_id,
        reason: `Redraft requested: ${lead.company}`,
        context: { leadId: lead.id },
      });

      const noteLine = message
        ? ` The founder asked for this specifically: "${message}".`
        : "";
      const handoffMessage: ModelMessage = {
        role: "user",
        content: `[Redraft requested] Redraft the outreach email for ${lead.company}.${noteLine} Fit: ${lead.fit}. Decision maker: ${lead.decision_maker}. Website: ${lead.website}. Sources: ${lead.sources}.`,
      };

      try {
        await runGraphJob(supabase, {
          userId,
          initiatingRole: "sales_representative",
          messages: [handoffMessage],
          leadId: lead.id,
          pendingDelegationId: delegation.id,
        });
      } catch (error) {
        await updateLeadRedraftStatus(supabase, {
          id: leadId,
          userId,
          status: "failed",
          error: error instanceof Error ? error.message : "Redraft failed.",
        });
        throw error;
      }

      // `runGraphJob` -> draftOutreachTool -> saveDraftEmail already wrote
      // the new draft; clear the in-flight marker now that it's done.
      await updateLeadRedraftStatus(supabase, {
        id: leadId,
        userId,
        status: null,
      });

      return "completed";
    });

    log.info("inngest job finished", {
      job: "redraft-outreach",
      userId,
      leadId,
      outcome,
    });

    return { status: "completed" };
  },
);
