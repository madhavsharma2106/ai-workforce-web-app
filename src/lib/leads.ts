import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentRun, ApprovalStatus, Lead } from "@/lib/types";

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

  const [{ data: leadRows }, { data: researchStep }] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("run_id", run.id)
      .order("created_at", { ascending: true }),
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
    leads: ((leadRows as LeadRow[] | null) ?? []).map(toLead),
    researchedCount,
  };
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
