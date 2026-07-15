import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelMessage } from "ai";
import { listEmployees, type EmployeeRole } from "@/lib/employees";
import { buildEmployeeGraph } from "./graph";
import { updateAgentRun } from "@/lib/agentRuns";

const FAILURE_SUMMARY =
  "I ran into an unexpected problem and couldn't finish this task. Please try again.";

/**
 * Resolves the caller's employees and invokes the delegation graph.
 * Shared by both entry points into a graph run: the free-text "run again"
 * debug path (`employee/run.requested`) and the founder-triggered
 * lead-approval handoff (`leads/approved`), which additionally seeds
 * `leadId` and `pendingDelegationId` so the target node can bind its tool
 * to a specific lead and link back to an already-inserted delegation row.
 */
export async function runGraphJob(
  supabase: SupabaseClient,
  input: {
    userId: string;
    initiatingRole: EmployeeRole;
    messages: ModelMessage[];
    leadId?: string;
    pendingDelegationId?: string;
  },
): Promise<void> {
  const employees = await listEmployees(supabase, input.userId);

  const employeeIdByRole: Partial<Record<EmployeeRole, string>> = {};
  for (const employee of employees) {
    employeeIdByRole[employee.role] = employee.id;
  }

  const { graph, ctx } = buildEmployeeGraph({
    supabase,
    userId: input.userId,
    employeeIdByRole,
    initiatingRole: input.initiatingRole,
    leadId: input.leadId,
  });

  try {
    await graph.invoke(
      {
        messages: input.messages,
        pendingDelegationId: input.pendingDelegationId,
      },
      { recursionLimit: 6, configurable: { thread_id: crypto.randomUUID() } },
    );
  } catch (error) {
    console.error("runGraphJob: graph invocation failed", error);
    const completedAt = new Date().toISOString();
    const runIdsToFail = Object.values(ctx.runIdByRole).filter(
      (runId): runId is string =>
        Boolean(runId) && !ctx.completedRunIds.has(runId),
    );

    await Promise.all(
      runIdsToFail.map((runId) =>
        updateAgentRun(supabase, runId, {
          status: "failed",
          summary: FAILURE_SUMMARY,
          completed_at: completedAt,
        }).catch((updateError) =>
          console.error(
            `runGraphJob: failed to mark run ${runId} as failed`,
            updateError,
          ),
        ),
      ),
    );

    throw error;
  }
}
