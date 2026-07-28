import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentRun,
  ApprovalStatus,
  DraftSaveStatus,
  Lead,
  RedraftStatus,
  SendStatus,
  TaskHistoryItem,
} from "@/lib/types";

type LeadRow = {
  id: string;
  company: string;
  website: string;
  fit: string;
  decision_maker: string;
  email: string;
  subject: string;
  draft: string;
  sources: string;
  person_id: string | null;
  email_revealed: boolean;
  status: ApprovalStatus;
  draft_status: ApprovalStatus;
  send_status: SendStatus;
  send_error: string | null;
  sent_at: string | null;
  draft_save_status: DraftSaveStatus;
  draft_save_error: string | null;
  draft_saved_at: string | null;
  redraft_status: RedraftStatus | null;
  redraft_error: string | null;
  conversation_id: string | null;
  last_reply_snippet: string | null;
  reply_draft: string;
  reply_status: ApprovalStatus | null;
  reply_send_status: SendStatus;
  reply_send_error: string | null;
  reply_sent_at: string | null;
  feedback_reason: string | null;
  research_snippet: string | null;
  industry: string | null;
  employee_count: number | null;
  location: string | null;
  founded_year: number | null;
  company_linkedin_url: string | null;
  contact_linkedin_url: string | null;
  contact_seniority: string | null;
  contact_departments: string[] | null;
  segment: string | null;
  why_now: string | null;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    company: row.company,
    website: row.website,
    fit: row.fit,
    decisionMaker: row.decision_maker,
    email: row.email,
    subject: row.subject,
    draft: row.draft,
    sources: row.sources,
    personId: row.person_id ?? undefined,
    emailRevealed: row.email_revealed,
    status: row.status,
    draftStatus: row.draft_status,
    sendStatus: row.send_status,
    sendError: row.send_error ?? undefined,
    sentAt: row.sent_at ?? undefined,
    draftSaveStatus: row.draft_save_status,
    draftSaveError: row.draft_save_error ?? undefined,
    draftSavedAt: row.draft_saved_at ?? undefined,
    redraftStatus: row.redraft_status ?? undefined,
    redraftError: row.redraft_error ?? undefined,
    lastReplySnippet: row.last_reply_snippet ?? undefined,
    replyDraft: row.reply_draft,
    replyStatus: row.reply_status ?? undefined,
    replySendStatus: row.reply_send_status,
    replySendError: row.reply_send_error ?? undefined,
    replySentAt: row.reply_sent_at ?? undefined,
    feedbackReason: row.feedback_reason ?? undefined,
    researchSnippet: row.research_snippet ?? undefined,
    industry: row.industry ?? undefined,
    employeeCount: row.employee_count ?? undefined,
    location: row.location ?? undefined,
    foundedYear: row.founded_year ?? undefined,
    companyLinkedinUrl: row.company_linkedin_url ?? undefined,
    contactLinkedinUrl: row.contact_linkedin_url ?? undefined,
    seniority: row.contact_seniority ?? undefined,
    departments: row.contact_departments ?? undefined,
    segment: row.segment ?? undefined,
    whyNow: row.why_now ?? undefined,
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
    sources: string;
    personId?: string;
    researchSnippet?: string;
    industry?: string;
    employeeCount?: number;
    location?: string;
    foundedYear?: number;
    companyLinkedinUrl?: string;
    contactLinkedinUrl?: string;
    seniority?: string;
    departments?: string[];
    segment?: string;
    whyNow?: string;
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
      sources: input.sources,
      person_id: input.personId ?? null,
      research_snippet: input.researchSnippet ?? null,
      industry: input.industry ?? null,
      employee_count: input.employeeCount ?? null,
      location: input.location ?? null,
      founded_year: input.foundedYear ?? null,
      company_linkedin_url: input.companyLinkedinUrl ?? null,
      contact_linkedin_url: input.contactLinkedinUrl ?? null,
      contact_seniority: input.seniority ?? null,
      contact_departments: input.departments ?? null,
      segment: input.segment ?? null,
      why_now: input.whyNow ?? null,
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

type PassedCandidate = { company: string; reason: string };

/** Sums `totalFound` across every `search_leads` call in a run (there can be more than one keyword pass per run). */
function sumResearchedCount(rows: { output: unknown }[]): number {
  return rows.reduce((sum, row) => {
    const output = row.output as { totalFound?: number } | null;
    return sum + (output?.totalFound ?? 0);
  }, 0);
}

export async function getLatestRunWithLeads(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string },
): Promise<{
  run: AgentRun | null;
  leads: Lead[];
  researchedCount: number;
  passedCandidates: PassedCandidate[];
}> {
  const { data: run } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run)
    return { run: null, leads: [], researchedCount: 0, passedCandidates: [] };

  const [leads, { data: researchSteps }, passedCandidates] = await Promise.all([
    getLeadsByRunId(supabase, { runId: run.id }),
    supabase
      .from("agent_run_steps")
      .select("output")
      .eq("run_id", run.id)
      .eq("tool_name", "search_leads"),
    getPassedCandidates(supabase, { runId: run.id }),
  ]);

  const researchedCount = sumResearchedCount(
    (researchSteps as { output: unknown }[] | null) ?? [],
  );

  return {
    run: run as AgentRun,
    leads,
    researchedCount,
    passedCandidates,
  };
}

export async function getPassedCandidates(
  supabase: SupabaseClient,
  input: { runId: string },
): Promise<PassedCandidate[]> {
  const { data } = await supabase
    .from("agent_run_steps")
    .select("input")
    .eq("run_id", input.runId)
    .eq("tool_name", "note_passed_candidates")
    .order("seq", { ascending: true });

  const rows = (data as { input: unknown }[] | null) ?? [];
  return rows.flatMap(
    (row) => (row.input as { passed?: PassedCandidate[] } | null)?.passed ?? [],
  );
}

export async function getRunHistory(
  supabase: SupabaseClient,
  input: {
    userId: string;
    employeeId: string;
    excludeRunId?: string;
    limit?: number;
  },
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
      .eq("tool_name", "search_leads"),
  ]);

  const countsByRun = new Map<
    string,
    { approved: number; rejected: number; pending: number }
  >();
  for (const row of (leadRows as
    { run_id: string; status: ApprovalStatus }[] | null) ?? []) {
    const counts = countsByRun.get(row.run_id) ?? {
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    counts[row.status] += 1;
    countsByRun.set(row.run_id, counts);
  }

  const researchedByRun = new Map<string, number>();
  for (const row of (researchRows as
    { run_id: string; output: unknown }[] | null) ?? []) {
    const totalFound =
      (row.output as { totalFound?: number } | null)?.totalFound ?? 0;
    researchedByRun.set(
      row.run_id,
      (researchedByRun.get(row.run_id) ?? 0) + totalFound,
    );
  }

  return runRows.map((run) => {
    const counts = countsByRun.get(run.id) ?? {
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    return {
      ...run,
      leadCounts: {
        ...counts,
        total: counts.approved + counts.rejected + counts.pending,
      },
      researchedCount: researchedByRun.get(run.id) ?? 0,
    };
  });
}

export type SegmentStats = {
  segment: string;
  approved: number;
  rejected: number;
  pending: number;
};

/** Approval/rejection counts per named ICP segment, so Emma can see which segments are actually converting. Leads saved without a segment are excluded — there's nothing to break down. */
function computeSegmentStats(
  rows: { segment: string | null; status: ApprovalStatus }[],
): SegmentStats[] {
  const bySegment = new Map<string, SegmentStats>();
  for (const row of rows) {
    if (!row.segment) continue;
    const stats = bySegment.get(row.segment) ?? {
      segment: row.segment,
      approved: 0,
      rejected: 0,
      pending: 0,
    };
    stats[row.status] += 1;
    bySegment.set(row.segment, stats);
  }
  return Array.from(bySegment.values());
}

export async function getFeedbackContext(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string },
): Promise<{
  approvedCompanies: string[];
  rejected: { company: string; reason: string | null }[];
  seenDomains: string[];
  segmentStats: SegmentStats[];
}> {
  const { data } = await supabase
    .from("leads")
    .select("company, website, status, feedback_reason, segment")
    .eq("user_id", input.userId)
    .eq("employee_id", input.employeeId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows =
    (data as
      | {
          company: string;
          website: string;
          status: ApprovalStatus;
          feedback_reason: string | null;
          segment: string | null;
        }[]
      | null) ?? [];

  return {
    approvedCompanies: rows
      .filter((r) => r.status === "approved")
      .map((r) => r.company),
    rejected: rows
      .filter((r) => r.status === "rejected")
      .map((r) => ({ company: r.company, reason: r.feedback_reason })),
    seenDomains: rows
      .map(
        (r) =>
          r.website
            .replace(/^https?:\/\//i, "")
            .replace(/^www\./i, "")
            .split("/")[0],
      )
      .filter(Boolean),
    segmentStats: computeSegmentStats(rows),
  };
}

export type LearningsSummary = {
  approvedCount: number;
  rejectedCount: number;
  topRejectionReasons: { reason: string; count: number }[];
  segmentStats: SegmentStats[];
};

/** A founder-facing view of what Emma has learned so far, built from the same feedback data she uses to qualify leads — a plain aggregation, not a new synthesis step. */
export async function getLearningsSummary(
  supabase: SupabaseClient,
  input: { userId: string; employeeId: string },
): Promise<LearningsSummary> {
  const feedback = await getFeedbackContext(supabase, input);

  const reasonCounts = new Map<string, number>();
  for (const { reason } of feedback.rejected) {
    if (!reason) continue;
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }

  return {
    approvedCount: feedback.approvedCompanies.length,
    rejectedCount: feedback.rejected.length,
    topRejectionReasons: Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    segmentStats: feedback.segmentStats,
  };
}

export async function getLeadById(
  supabase: SupabaseClient,
  input: { id: string; userId: string },
): Promise<Lead | null> {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", input.id)
    .eq("user_id", input.userId)
    .maybeSingle();

  return data ? toLead(data as LeadRow) : null;
}

const FALLBACK_DRAFT_ERROR =
  "I ran into an unexpected problem and couldn't finish this task.";

// Correlates a lead to its Oliver drafting run: there's no `lead_id` column
// on `agent_runs`, so this goes through the `delegations` row created for
// the handoff (`context.leadId`) and its `to_run_id`.
async function getFailedDraftLeadIds(
  supabase: SupabaseClient,
  input: { userId: string },
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from("delegations")
    .select("context, agent_runs:to_run_id(status, summary)")
    .eq("user_id", input.userId)
    .eq("to_role", "sales_representative");

  const failedByLeadId = new Map<string, string>();
  for (const row of (data as
    | {
        context: { leadId?: string } | null;
        agent_runs: { status: string; summary: string | null } | null;
      }[]
    | null) ?? []) {
    if (row.agent_runs?.status !== "failed") continue;
    const leadId = row.context?.leadId;
    if (!leadId) continue;
    failedByLeadId.set(leadId, row.agent_runs.summary ?? FALLBACK_DRAFT_ERROR);
  }
  return failedByLeadId;
}

export async function getLeadsAwaitingOutreach(
  supabase: SupabaseClient,
  input: { userId: string },
): Promise<Lead[]> {
  // Not filtered by employee_id: that column is permanently Emma's id
  // (set at insert), so Oliver's queue is defined by `status`, not row
  // ownership.
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", input.userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const leads = ((data as LeadRow[] | null) ?? []).map(toLead);
  const stillDrafting = leads.filter((lead) => lead.draft === "");
  if (stillDrafting.length === 0) return leads;

  const failedByLeadId = await getFailedDraftLeadIds(supabase, {
    userId: input.userId,
  });
  if (failedByLeadId.size === 0) return leads;

  return leads.map((lead) => {
    const draftError =
      lead.draft === "" ? failedByLeadId.get(lead.id) : undefined;
    return draftError ? { ...lead, draftFailed: true, draftError } : lead;
  });
}

export async function saveDraftEmail(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    subject: string;
    draft: string;
    runId: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      subject: input.subject,
      draft: input.draft,
      draft_status: "pending",
      draft_run_id: input.runId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function saveReplyDraft(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    replyDraft: string;
    runId: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      reply_draft: input.replyDraft,
      reply_status: "pending",
      reply_run_id: input.runId,
      // Reset from any prior reply cycle on this same thread — otherwise
      // sendReplyOnApproval's idempotency check ("already sent") would
      // incorrectly block sending this new reply, since that flag would
      // still read "sent" from the last cycle.
      reply_send_status: "not_sent",
      reply_send_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadReplyStatus(
  supabase: SupabaseClient,
  input: { id: string; userId: string; status: ApprovalStatus },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      reply_status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadDraftStatus(
  supabase: SupabaseClient,
  input: { id: string; userId: string; status: ApprovalStatus },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      draft_status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
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

export async function updateLeadSubject(
  supabase: SupabaseClient,
  input: { id: string; userId: string; subject: string },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ subject: input.subject, updated_at: new Date().toISOString() })
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
    .update({
      feedback_reason: input.feedbackReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}

export async function updateLeadRedraftStatus(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    status: RedraftStatus | null;
    error?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({
      redraft_status: input.status,
      redraft_error: input.error ?? null,
      updated_at: new Date().toISOString(),
    })
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
    .update({
      email: input.email,
      email_revealed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("user_id", input.userId);
  if (error) throw error;
}
