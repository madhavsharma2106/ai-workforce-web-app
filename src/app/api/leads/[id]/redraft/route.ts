import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { getLeadById, updateLeadRedraftStatus } from "@/lib/leads";
import { inngest } from "@/lib/inngest/client";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  try {
    const lead = await getLeadById(supabase, { id, userId: user.id });
    if (
      !lead ||
      lead.draftStatus !== "pending" ||
      lead.draft === "" ||
      lead.redraftStatus === "redrafting"
    ) {
      return NextResponse.json(
        { error: "This email isn't ready to redraft." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";

    await updateLeadRedraftStatus(supabase, {
      id,
      userId: user.id,
      status: "redrafting",
    });

    try {
      await inngest.send({
        name: "leads/redraft-requested",
        data: { userId: user.id, leadId: id, message: message || undefined },
      });
    } catch (error) {
      console.error("Failed to send leads/redraft-requested to Inngest", error);
      return NextResponse.json(
        { error: "Couldn't start redrafting — try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
