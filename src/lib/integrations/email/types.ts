export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export type SentMailResult = {
  /** The Graph conversation id of the sent thread, when the provider can report one — lets a later poll find replies on this exact thread. */
  conversationId?: string;
};

export type InboundMessage = {
  id: string;
  conversationId: string;
  from: string;
  receivedAt: string;
  subject: string;
  /** Plain-text body snippet/full text, for feeding to the model and showing the founder what the prospect said. */
  body: string;
  /** True when the message looks like an automated reply (OOO, bounce, auto-responder) — callers should skip drafting a response to these. */
  isAutomated: boolean;
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
  sendMail(
    credentials: unknown,
    message: EmailMessage,
  ): Promise<SentMailResult>;
  /** Pushes the message into the mailbox's real Drafts folder without sending it. Optional — not every provider supports it. */
  saveDraft?(credentials: unknown, message: EmailMessage): Promise<void>;
  /** Lists inbox messages received since `since` (ISO timestamp), one call per mailbox — not per conversation. Optional; only needed for reply monitoring. */
  listInboxMessagesSince?(
    credentials: unknown,
    input: { since: string },
  ): Promise<InboundMessage[]>;
  /** Sends a reply to a specific inbound message id, preserving thread/subject headers. Optional; only needed for reply monitoring. */
  sendReply?(
    credentials: unknown,
    input: { messageId: string; body: string },
  ): Promise<void>;
  refreshIfNeeded?(credentials: unknown): Promise<unknown | null>;
};
