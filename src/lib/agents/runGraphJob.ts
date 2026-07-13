import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelMessage } from "ai";
import { listEmployees, type EmployeeRole } from "@/lib/employees";
import { buildEmployeeGraph } from "./graph";

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

  const graph = buildEmployeeGraph({
    supabase,
    userId: input.userId,
    employeeIdByRole,
    initiatingRole: input.initiatingRole,
    leadId: input.leadId,
  });

  await graph.invoke(
    { messages: input.messages, pendingDelegationId: input.pendingDelegationId },
    { recursionLimit: 6, configurable: { thread_id: crypto.randomUUID() } },
  );
}
