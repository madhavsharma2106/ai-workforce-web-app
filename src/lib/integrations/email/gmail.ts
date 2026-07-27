import type {
  EmailMessage,
  EmailProvider,
  InboundMessage,
  SentMailResult,
} from "./types";

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1";
// gmail.modify alone covers send, drafts, and reading the inbox (Google's
// per-method scope docs list it as sufficient for messages.send and
// drafts.create, not just read/modify) — no need to also request
// gmail.send/gmail.compose on top of it.
const SCOPES = "https://www.googleapis.com/auth/gmail.modify";

export class GmailConfigError extends Error {
  constructor() {
    super(
      "Google OAuth env vars are not configured. Add GOOGLE_CLIENT_ID, " +
        "GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to .env.local.",
    );
    this.name = "GmailConfigError";
  }
}

export class GmailRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailRequestError";
  }
}

export type GmailCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new GmailConfigError();
  }
  return { clientId, clientSecret, redirectUri };
}

export function getAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    // access_type=offline + prompt=consent are both required to get a
    // refresh_token back on the code exchange — without prompt=consent,
    // Google silently omits it on anything but a founder's very first grant.
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function requestToken(
  body: Record<string, string>,
): Promise<TokenResponse> {
  const { clientId, clientSecret } = getConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...body,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Google token request failed with status ${response.status}: ${detail}`,
    );
  }

  return response.json();
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<GmailCredentials> {
  const { redirectUri } = getConfig();
  const data = await requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (!data.refresh_token) {
    throw new GmailRequestError(
      "Google did not return a refresh token. Reconnect and make sure to " +
        "approve offline access when prompted.",
    );
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

// Google never reissues a refresh token on a refresh_token grant, so the
// caller's existing one is carried forward unchanged.
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GmailCredentials> {
  const data = await requestToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

export async function getConnectedEmail(accessToken: string): Promise<string> {
  const response = await fetch(`${GMAIL_BASE_URL}/users/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Failed to fetch connected mailbox: ${response.status}: ${detail}`,
    );
  }
  const data = (await response.json()) as { emailAddress?: string };
  if (!data.emailAddress)
    throw new GmailRequestError("Gmail did not return a mailbox address.");
  return data.emailAddress;
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function refreshIfNeeded(credentials: unknown): Promise<unknown | null> {
  const creds = credentials as GmailCredentials;
  const expiresAt = new Date(creds.expiresAt).getTime();
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) return null;
  return refreshAccessToken(creds.refreshToken);
}

/** Encodes header values as an RFC 2047 encoded-word when they contain non-ASCII text (e.g. an accented subject line) — a bare UTF-8 byte in a header would produce a malformed message. */
function encodeHeaderValue(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

function buildRawMessage(input: {
  to: string;
  subject: string;
  body: string;
  extraHeaders?: string[];
}): string {
  const headers = [
    `To: ${input.to}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    ...(input.extraHeaders ?? []),
  ];
  const message = `${headers.join("\r\n")}\r\n\r\n${input.body}`;
  return Buffer.from(message, "utf-8").toString("base64url");
}

type GmailHeader = { name: string; value: string };

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  internalDate?: string;
  payload?: GmailPart & { headers?: GmailHeader[] };
};

async function fetchMessage(
  accessToken: string,
  id: string,
): Promise<GmailMessage> {
  const response = await fetch(
    `${GMAIL_BASE_URL}/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Gmail message fetch failed with status ${response.status}: ${detail}`,
    );
  }
  return response.json();
}

function extractPlainTextBody(payload?: GmailPart): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  for (const part of payload.parts ?? []) {
    const text = extractPlainTextBody(part);
    if (text) return text;
  }
  return "";
}

async function sendMail(
  credentials: unknown,
  message: EmailMessage,
): Promise<SentMailResult> {
  const creds = credentials as GmailCredentials;
  const raw = buildRawMessage(message);
  const response = await fetch(`${GMAIL_BASE_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Gmail send failed with status ${response.status}: ${detail}`,
    );
  }

  const sent = (await response.json()) as { threadId?: string };
  return { conversationId: sent.threadId };
}

async function saveDraft(
  credentials: unknown,
  message: EmailMessage,
): Promise<void> {
  const creds = credentials as GmailCredentials;
  const raw = buildRawMessage(message);
  const response = await fetch(`${GMAIL_BASE_URL}/users/me/drafts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Gmail draft creation failed with status ${response.status}: ${detail}`,
    );
  }
}

const AUTOMATED_SUBJECT_PATTERN =
  /^(automatic reply|auto[- ]?reply|out of office|undeliverable)/i;

/** Detects OOO/bounce/auto-responder messages so callers don't draft a response to them (and risk a reply-to-autoreply loop). */
function isAutomatedMessage(subject: string, headers: GmailHeader[]): boolean {
  const autoSubmitted = headers.find(
    (h) => h.name.toLowerCase() === "auto-submitted",
  );
  if (autoSubmitted && autoSubmitted.value.toLowerCase() !== "no") return true;
  return AUTOMATED_SUBJECT_PATTERN.test(subject.trim());
}

async function listInboxMessagesSince(
  credentials: unknown,
  input: { since: string },
): Promise<InboundMessage[]> {
  const creds = credentials as GmailCredentials;
  const afterSeconds = Math.floor(new Date(input.since).getTime() / 1000);
  const params = new URLSearchParams({
    q: `in:inbox after:${afterSeconds}`,
    maxResults: "50",
  });
  const listResponse = await fetch(
    `${GMAIL_BASE_URL}/users/me/messages?${params.toString()}`,
    { headers: { Authorization: `Bearer ${creds.accessToken}` } },
  );

  if (!listResponse.ok) {
    const detail = await listResponse.text().catch(() => "");
    throw new GmailRequestError(
      `Gmail inbox listing failed with status ${listResponse.status}: ${detail}`,
    );
  }

  const listData = (await listResponse.json()) as {
    messages?: { id: string }[];
  };
  const ids = listData.messages ?? [];
  const messages = await Promise.all(
    ids.map((m) => fetchMessage(creds.accessToken, m.id)),
  );

  return messages.map((message) => {
    const headers = message.payload?.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
      "";
    const subject = getHeader("Subject");
    const receivedAt = message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString();
    return {
      id: message.id,
      conversationId: message.threadId,
      from: getHeader("From"),
      receivedAt,
      subject,
      body: extractPlainTextBody(message.payload),
      isAutomated: isAutomatedMessage(subject, headers),
    };
  });
}

async function sendReply(
  credentials: unknown,
  input: { messageId: string; body: string },
): Promise<void> {
  const creds = credentials as GmailCredentials;
  const original = await fetchMessage(creds.accessToken, input.messageId);
  const headers = original.payload?.headers ?? [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

  const from = getHeader("From");
  if (!from)
    throw new GmailRequestError(
      "Original message has no From address to reply to.",
    );

  const subject = getHeader("Subject") ?? "";
  const replySubject = /^re:/i.test(subject.trim())
    ? subject
    : `Re: ${subject}`;
  const originalMessageId = getHeader("Message-ID");
  const references = [getHeader("References"), originalMessageId]
    .filter(Boolean)
    .join(" ");

  // In-Reply-To/References are what let Gmail (and every other client)
  // thread this as a reply rather than a new message — threadId alone
  // groups it in Gmail's own UI but doesn't set the RFC 2822 headers other
  // mail clients rely on.
  const raw = buildRawMessage({
    to: from,
    subject: replySubject,
    body: input.body,
    extraHeaders: [
      originalMessageId ? `In-Reply-To: ${originalMessageId}` : "",
      references ? `References: ${references}` : "",
    ].filter((header) => header.length > 0),
  });

  const response = await fetch(`${GMAIL_BASE_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw, threadId: original.threadId }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailRequestError(
      `Gmail reply failed with status ${response.status}: ${detail}`,
    );
  }
}

export const gmailProvider: EmailProvider = {
  sendMail,
  saveDraft,
  listInboxMessagesSince,
  sendReply,
  refreshIfNeeded,
};
