import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentRun,
  AgentRunStatus,
  AgentRunStep,
  AgentRunStepType,
  Delegation,
  DelegationStatus,
} from "@/lib/types";
import type { EmployeeRole } from "@/lib/employees";

export async function createAgentRun(
  supabase: SupabaseClient,
  input: {
    userId: string;
    employeeId: string;
    trigger: "manual" | "delegation";
    jobId?: string;
  },
): Promise<AgentRun> {
  const { data, error } = await supabase
    .from("agent_runs")
    .insert({
      user_id: input.userId,
      employee_id: input.employeeId,
      trigger: input.trigger,
      job_id: input.jobId ?? null,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as AgentRun;
}

export async function updateAgentRun(
  supabase: SupabaseClient,
  runId: string,
  update: Partial<{ status: AgentRunStatus; summary: string; completed_at: string }>,
): Promise<void> {
  const { error } = await supabase.from("agent_runs").update(update).eq("id", runId);
  if (error) throw error;
}

export async function insertAgentRunStep(
  supabase: SupabaseClient,
  input: {
    userId: string;
    runId: string;
    seq: number;
    type: AgentRunStepType;
    toolName?: string;
    input?: unknown;
    output?: unknown;
    label?: string;
  },
): Promise<AgentRunStep> {
  const { data, error } = await supabase
    .from("agent_run_steps")
    .insert({
      user_id: input.userId,
      run_id: input.runId,
      seq: input.seq,
      type: input.type,
      tool_name: input.toolName ?? null,
      input: input.input ?? null,
      output: input.output ?? null,
      label: input.label ?? null,
      status: "completed",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as AgentRunStep;
}

export async function insertDelegation(
  supabase: SupabaseClient,
  input: {
    userId: string;
    fromEmployeeId: string;
    toRole: EmployeeRole;
    toEmployeeId?: string;
    fromRunId: string;
    toRunId?: string;
    reason: string;
    context?: unknown;
    status?: DelegationStatus;
  },
): Promise<Delegation> {
  const { data, error } = await supabase
    .from("delegations")
    .insert({
      user_id: input.userId,
      from_employee_id: input.fromEmployeeId,
      to_role: input.toRole,
      to_employee_id: input.toEmployeeId ?? null,
      from_run_id: input.fromRunId,
      to_run_id: input.toRunId ?? null,
      reason: input.reason,
      context: input.context ?? null,
      status: input.status ?? "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Delegation;
}
