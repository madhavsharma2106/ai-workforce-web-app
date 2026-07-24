export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

/**
 * One capability set every mailbox provider implements in its own way —
 * for Outlook that's Graph API calls, for a future provider it might be a
 * different API entirely. `refreshIfNeeded` is optional because not every
 * provider has expiring credentials; `sendViaConnection` (see
 * mailboxConnections.ts) is the only caller, and persists whatever it
 * returns back to Vault before sending.
 */
export type EmailProvider = {
  sendMail(credentials: unknown, message: EmailMessage): Promise<void>;
  /** Pushes the message into the mailbox's real Drafts folder without sending it. Optional — not every provider supports it. */
  saveDraft?(credentials: unknown, message: EmailMessage): Promise<void>;
  refreshIfNeeded?(credentials: unknown): Promise<unknown | null>;
};
