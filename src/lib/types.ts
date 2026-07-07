export type Lead = {
  id: number;
  company: string;
  website: string;
  fit: string;
  decisionMaker: string;
  email: string;
  draft: string;
  sources: string;
  personId?: string;
  emailRevealed?: boolean;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Day = {
  id: number;
  dateLabel: string;
  leads: Lead[];
  statuses: Record<number, ApprovalStatus>;
  drafts: Record<number, string>;
  feedback: Record<number, string>;
  standup: string;
  learned: string;
  researched: number;
};
