import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentRun, ApprovalStatus, Lead, TaskHistoryItem } from "@/lib/types";

type LeadRow = {
  id: string;
  company: string;
  website: string;
  fit: string;
  decision_maker: string;
  email: string;
  draft: string;
  sources: string;
  person_id: string | null;
  email_revealed: boolean;
  status: ApprovalStatus;
  feedback_reason: string | null;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    company: row.company,
    website: row.website,
    fit: row.fit,
    decisionMaker: row.decision_maker,
    email: row.email,
    draft: row.draft,
    sources: row.sources,
    personId: row.person_id ?? undefined,
    emailRevealed: row.email_revealed,
    status: row.status,
    feedbackReason: row.feedback_reason ?? undefined,
  };
}

export async function insertLead(
  supabase: SupabaseClient,
  input: {
    userId: string;
    employeeId: string;
    runId: string;
    company: string;
    website: string;
    fit: string;
    decisionMaker: string;
    draft: string;
    sources: string;
    personId?: string;
  },
): Promise<Lead> {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: input.userId,
      employee_id: input.employeeId,
      run_id: input.runId,
      company: input.company,
      website: input.website,
      fit: input.fit,
      decision_maker: input.decisionMaker,
      draft: input.draft,
      sources: input.sources,
      person_id: input.personId ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toLead(data as LeadRow);
}

export async function getLeadsByRunId(
  supabase: SupabaseClient,
  input: { runId: string },
): Promise<Lead[]> {
  const { data: leadRows } = await supabase
    .from("leads")
    .select("*")
    .eq("run_id", input.runId)
    .order("created_at", { ascending: true });

  return ((leadRows as LeadRow[] | null) ?? []).map(toLead);
}

export async function getLatestRunWithLeads(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string },
): Promise<{ run: AgentRun | null; leads: Lead[]; researchedCount: number }> {
  const { data: run } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run) return { run: null, leads: [], researchedCount: 0 };

  const [leads, { data: researchStep }] = await Promise.all([
    getLeadsByRunId(supabase, { runId: run.id }),
    supabase
      .from("agent_run_steps")
      .select("output")
      .eq("run_id", run.id)
      .eq("tool_name", "research_companies")
      .maybeSingle(),
  ]);

  const researchedCount =
    ((researchStep?.output as { researched?: number } | null)?.researched) ?? 0;

  return {
    run: run as AgentRun,
    leads,
    researchedCount,
  };
}

export async function getRunHistory(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string; excludeRunId?: string; limit?: number },
): Promise<TaskHistoryItem[]> {
  let query = supabase
    .from("agent_runs")
    .select("*")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 10);

  if (input.excludeRunId) {
    query = query.neq("id", input.excludeRunId);
  }

  const { data: runs } = await query;
  const runRows = (runs as AgentRun[] | null) ?? [];
  if (runRows.length === 0) return [];

  const runIds = runRows.map((r) => r.id);

  const [{ data: leadRows }, { data: researchRows }] = await Promise.all([
    supabase.from("leads").select("run_id, status").in("run_id", runIds),
    supabase
      .from("agent_run_steps")
      .select("run_id, output")
      .in("run_id", runIds)
      .eq("tool_name", "research_companies"),
  ]);

  const countsByRun = new Map<string, { approved: number; rejected: number; pending: number }>();
  for (const row of (leadRows as { run_id: string; status: ApprovalStatus }[] | null) ?? []) {
    const counts = countsByRun.get(row.run_id) ?? { approved: 0, rejected: 0, pending: 0 };
    counts[row.status] += 1;
    countsByRun.set(row.run_id, counts);
  }

  const researchedByRun = new Map<string, number>();
  for (const row of (researchRows as { run_id: string; output: unknown }[] | null) ?? []) {
    const researched = (row.output as { researched?: number } | null)?.researched ?? 0;
    researchedByRun.set(row.run_id, researched);
  }

  return runRows.map((run) => {
    const counts = countsByRun.get(run.id) ?? { approved: 0, rejected: 0, pending: 0 };
    return {
      ...run,
      leadCounts: { ...counts, total: counts.approved + counts.rejected + counts.pending },
      researchedCount: researchedByRun.get(run.id) ?? 0,
    };
  });
}

export async function getFeedbackContext(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string },
): Promise<{
  approvedCompanies: string[];
  rejected: { company: string; reason: string | null }[];
  seenDomains: string[];
}> {
  const { data } = await supabase
    .from("leads")
    .select("company, website, status, feedback_reason")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data as
    | { company: string; website: string; status: ApprovalStatus; feedback_reason: string | null }[]
    | null) ?? [];

  return {
    approvedCompanies: rows.filter((r) => r.status === "approved").map((r) => r.company),
    rejected: rows
      .filter((r) => r.status === "rejected")
      .map((r) => ({ company: r.company, reason: r.feedback_reason })),
    seenDomains: rows
      .map((r) => r.website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0])
      .filter(Boolean),
  };
}

export async function updateLeadStatus(
  supabase: SupabaseClient,
  input: { id: string; userId: string; status: ApprovalStatus },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadDraft(
  supabase: SupabaseClient,
  input: { id: string; userId: string; draft: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ draft: input.draft, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadFeedback(
  supabase: SupabaseClient,
  input: { id: string; userId: string; feedbackReason: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ feedback_reason: input.feedbackReason, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadEmail(
  supabase: SupabaseClient,
  input: { id: string; userId: string; email: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ email: input.email, email_revealed: true, updated_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}
