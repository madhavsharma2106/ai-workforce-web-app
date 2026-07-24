import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import {
  exchangeCodeForTokens,
  getConnectedEmail,
} from "@/lib/integrations/email/outlook";
import { upsertMailboxConnection } from "@/lib/mailboxConnections";

const STATE_COOKIE = "outlook_oauth_state";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/settings?mailbox=error", request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = await getConnectedEmail(tokens.accessToken);
    await upsertMailboxConnection(supabase, {
      userId: user.id,
      provider: "outlook",
      email,
      credentials: tokens,
    });
  } catch (error) {
    console.error("Failed to complete Outlook OAuth connect", error);
    return NextResponse.redirect(
      new URL("/settings?mailbox=error", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/settings?mailbox=connected", request.url),
  );
}
