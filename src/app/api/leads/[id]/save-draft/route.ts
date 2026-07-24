import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { inngest } from "@/lib/inngest/client";
import type { IdRouteParams } from "@/lib/types";

export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const { data: mailbox } = await supabase
    .from("mailbox_connections")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mailbox) {
    return NextResponse.json(
      { error: "Connect your mailbox in Settings before saving a draft." },
      { status: 400 },
    );
  }

  try {
    await inngest.send({
      name: "leads/save-draft-requested",
      data: { userId: user.id, leadId: id },
    });
  } catch (error) {
    console.error(
      "Failed to send leads/save-draft-requested to Inngest",
      error,
    );
    return NextResponse.json(
      { error: "Couldn't save the draft — try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
