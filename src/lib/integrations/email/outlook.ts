import type { EmailMessage, EmailProvider } from "./types";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
// Mail.ReadWrite is needed for saveDraft (POST /me/messages creates/writes a
// message resource, distinct from Mail.Send which only covers /sendMail).
// Anyone who connected before this scope was added must reconnect — Graph
// won't silently upgrade an existing refresh token's granted scope.
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

async function sendMail(
  credentials: unknown,
  message: EmailMessage,
): Promise<void> {
  const creds = credentials as OutlookCredentials;
  const response = await fetch(`${GRAPH_BASE_URL}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: message.subject,
        body: { contentType: "Text", content: message.body },
        toRecipients: [{ emailAddress: { address: message.to } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookRequestError(
      `Microsoft Graph sendMail failed with status ${response.status}: ${detail}`,
    );
  }
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

export const outlookProvider: EmailProvider = {
  sendMail,
  saveDraft,
  refreshIfNeeded,
};
