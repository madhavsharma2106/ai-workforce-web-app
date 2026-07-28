export type IdRouteParams = { params: Promise<{ id: string }> };

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type SendStatus = "not_sent" | "sending" | "sent" | "failed";
export type DraftSaveStatus = "not_saved" | "saving" | "saved" | "failed";
export type RedraftStatus = "redrafting" | "failed";

export type Lead = {
  id: string;
  company: string;
  website: string;
  fit: string;
  decisionMaker: string;
  email: string;
  subject: string;
  draft: string;
  sources: string;
  personId?: string;
  emailRevealed?: boolean;
  status: ApprovalStatus;
  draftStatus: ApprovalStatus;
  draftFailed?: boolean;
  draftError?: string;
  sendStatus: SendStatus;
  sendError?: string;
  sentAt?: string;
  draftSaveStatus: DraftSaveStatus;
  draftSaveError?: string;
  draftSavedAt?: string;
  redraftStatus?: RedraftStatus;
  redraftError?: string;
  lastReplySnippet?: string;
  replyDraft: string;
  replyStatus?: ApprovalStatus;
  replySendStatus: SendStatus;
  replySendError?: string;
  replySentAt?: string;
  feedbackReason?: string;
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
};

export type AgentRunTrigger = "manual" | "delegation";
export type AgentRunStatus =
  "queued" | "running" | "waiting_approval" | "completed" | "failed";

export type AgentRun = {
  id: string;
  user_id: string;
  employee_id: string;
  trigger: AgentRunTrigger;
  status: AgentRunStatus;
  summary: string | null;
  job_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type AgentRunStepType =
  "thinking" | "tool_call" | "tool_result" | "message" | "delegation";

export type AgentRunStep = {
  id: string;
  user_id: string;
  run_id: string;
  seq: number;
  type: AgentRunStepType;
  tool_name: string | null;
  input: unknown;
  output: unknown;
  label: string | null;
  status: "running" | "completed" | "failed";
  created_at: string;
};

export type TaskHistoryItem = AgentRun & {
  leadCounts: {
    approved: number;
    rejected: number;
    pending: number;
    total: number;
  };
  researchedCount: number;
};

export type PassedCandidate = { company: string; reason: string };

export type DelegationStatus =
  "pending" | "accepted" | "completed" | "declined";

export type Delegation = {
  id: string;
  user_id: string;
  from_employee_id: string;
  to_role: string;
  to_employee_id: string | null;
  from_run_id: string;
  to_run_id: string | null;
  reason: string;
  context: unknown;
  status: DelegationStatus;
  created_at: string;
};
