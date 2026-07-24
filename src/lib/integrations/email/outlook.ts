import type {
  EmailMessage,
  EmailProvider,
  InboundMessage,
  SentMailResult,
} from "./types";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
// Mail.ReadWrite is needed for saveDraft and sendMail's create-then-send
// (POST /me/messages creates/writes a message resource, distinct from
// Mail.Send which only covers /sendMail), and also covers reading the
// inbox for reply monitoring. Anyone who connected before this scope was
// added must reconnect — Graph won't silently upgrade an existing refresh
// token's granted scope.
const SCOPES =
  "Mail.Send Mail.ReadWrite offline_access openid profile email User.Read";

export class OutlookConfigError extends Error {
  constructor() {
    super(
      "Microsoft OAuth env vars are not configured. Add MICROSOFT_CLIENT_ID, " +
        "MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, and MICROSOFT_REDIRECT_URI to .env.local.",
    );
    this.name = "OutlookConfigError";
  }
}

export class OutlookRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutlookRequestError";
  }
}

export type OutlookCredentials = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

function getConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
  if (!clientId || !clientSecret || !tenantId || !redirectUri) {
    throw new OutlookConfigError();
  }
  return { clientId, clientSecret, tenantId, redirectUri };
}

export function getAuthorizeUrl(state: string): string {
  const { clientId, tenantId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    state,
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

async function requestToken(
  body: Record<string, string>,
): Promise<OutlookCredentials> {
  const { clientId, clientSecret, tenantId } = getConfig();
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: SCOPES,
        ...body,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft token request failed with status ${response.status}: ${detail}`,
    );
  }

  const data = (await response.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

export function exchangeCodeForTokens(
  code: string,
): Promise<OutlookCredentials> {
  const { redirectUri } = getConfig();
  return requestToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export function refreshAccessToken(
  refreshToken: string,
): Promise<OutlookCredentials> {
  return requestToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function getConnectedEmail(accessToken: string): Promise<string> {
  const response = await fetch(`${GRAPH_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Failed to fetch connected mailbox: ${response.status}: ${detail}`,
    );
  }
  const data = (await response.json()) as {
    mail?: string;
    userPrincipalName?: string;
  };
  const email = data.mail ?? data.userPrincipalName;
  if (!email)
    throw new OutlookRequestError(
      "Microsoft Graph did not return a mailbox address.",
    );
  return email;
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function refreshIfNeeded(credentials: unknown): Promise<unknown | null> {
  const creds = credentials as OutlookCredentials;
  const expiresAt = new Date(creds.expiresAt).getTime();
  if (expiresAt - Date.now() > REFRESH_MARGIN_MS) return null;
  return refreshAccessToken(creds.refreshToken);
}

/**
 * Create-then-send instead of the simpler POST /me/sendMail: that endpoint
 * returns 202 with an empty body, giving no way to learn the sent message's
 * conversationId. Creating the message first (same call saveDraft already
 * makes) returns the created resource's id/conversationId, then a separate
 * /send call on that id delivers it — same end result (one email, saved to
 * Sent Items by default), but now we have a conversationId to poll replies
 * against later.
 */
async function sendMail(
  credentials: unknown,
  message: EmailMessage,
): Promise<SentMailResult> {
  const creds = credentials as OutlookCredentials;
  const createResponse = await fetch(`${GRAPH_BASE_URL}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: message.subject,
      body: { contentType: "Text", content: message.body },
      toRecipients: [{ emailAddress: { address: message.to } }],
    }),
  });

  if (!createResponse.ok) {
    const detail = await createResponse.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph message creation failed with status ${createResponse.status}: ${detail}`,
    );
  }

  const created = (await createResponse.json()) as {
    id: string;
    conversationId?: string;
  };

  const sendResponse = await fetch(
    `${GRAPH_BASE_URL}/me/messages/${created.id}/send`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    },
  );

  if (!sendResponse.ok) {
    const detail = await sendResponse.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph send failed with status ${sendResponse.status}: ${detail}`,
    );
  }

  return { conversationId: created.conversationId };
}

async function saveDraft(
  credentials: unknown,
  message: EmailMessage,
): Promise<void> {
  const creds = credentials as OutlookCredentials;
  // POST /me/messages creates the message as a draft in the mailbox's real
  // Drafts folder by default — it's only sent if a separate /send action is
  // later called on it, which we never do here.
  const response = await fetch(`${GRAPH_BASE_URL}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: message.subject,
      body: { contentType: "Text", content: message.body },
      toRecipients: [{ emailAddress: { address: message.to } }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph draft creation failed with status ${response.status}: ${detail}`,
    );
  }
}

const AUTOMATED_SUBJECT_PATTERN =
  /^(automatic reply|auto[- ]?reply|out of office|undeliverable)/i;

/** Detects OOO/bounce/auto-responder messages so callers don't draft a response to them (and risk a reply-to-autoreply loop). */
function isAutomatedMessage(
  subject: string,
  headers: { name: string; value: string }[],
): boolean {
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
  const creds = credentials as OutlookCredentials;
  const params = new URLSearchParams({
    $filter: `receivedDateTime ge ${input.since}`,
    $select:
      "id,conversationId,from,receivedDateTime,subject,body,internetMessageHeaders",
    $top: "50",
  });
  const response = await fetch(
    `${GRAPH_BASE_URL}/me/mailFolders('inbox')/messages?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        // Plain text bodies, mirroring the contentType we send outbound —
        // avoids needing to strip HTML before handing this to the model.
        Prefer: 'outlook.body-content-type="text"',
      },
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph inbox listing failed with status ${response.status}: ${detail}`,
    );
  }

  const data = (await response.json()) as {
    value: {
      id: string;
      conversationId: string;
      from?: { emailAddress?: { address?: string } };
      receivedDateTime: string;
      subject?: string;
      body?: { content?: string };
      internetMessageHeaders?: { name: string; value: string }[];
    }[];
  };

  return data.value.map((message) => {
    const subject = message.subject ?? "";
    const headers = message.internetMessageHeaders ?? [];
    return {
      id: message.id,
      conversationId: message.conversationId,
      from: message.from?.emailAddress?.address ?? "",
      receivedAt: message.receivedDateTime,
      subject,
      body: message.body?.content ?? "",
      isAutomated: isAutomatedMessage(subject, headers),
    };
  });
}

async function sendReply(
  credentials: unknown,
  input: { messageId: string; body: string },
): Promise<void> {
  const creds = credentials as OutlookCredentials;
  // /reply preserves subject/threading headers automatically — unlike
  // sendMail, this can't be used to start a new thread, only to respond on
  // an existing message id.
  const response = await fetch(
    `${GRAPH_BASE_URL}/me/messages/${input.messageId}/reply`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: input.body }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph reply failed with status ${response.status}: ${detail}`,
    );
  }
}

export const outlookProvider: EmailProvider = {
  sendMail,
  saveDraft,
  listInboxMessagesSince,
  sendReply,
  refreshIfNeeded,
};
