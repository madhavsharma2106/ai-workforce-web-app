import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { getAuthorizeUrl } from "@/lib/integrations/email/gmail";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const state = randomBytes(24).toString("hex");

  let authorizeUrl: string;
  try {
    authorizeUrl = getAuthorizeUrl(state);
  } catch (error) {
    console.error("Failed to start Google OAuth connect", error);
    return NextResponse.redirect(
      new URL("/settings?mailbox=error", request.url),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(authorizeUrl);
}
