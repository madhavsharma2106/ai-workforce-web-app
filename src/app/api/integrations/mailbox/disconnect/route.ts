import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { deleteMailboxConnection } from "@/lib/mailboxConnections";

export async function POST() {
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  await deleteMailboxConnection(supabase, { userId: user.id });
  return NextResponse.json({ status: "ok" });
}
