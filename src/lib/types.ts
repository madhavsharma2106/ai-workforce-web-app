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
