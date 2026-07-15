import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { getLeadById } from "@/lib/leads";
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
    if (!lead || lead.status !== "approved" || lead.draft !== "") {
      return NextResponse.json(
        { error: "This lead isn't waiting on a draft retry." },
        { status: 400 },
      );
    }

    try {
      await inngest.send({
        name: "leads/approved",
        data: { userId: user.id, leadId: id },
      });
    } catch (error) {
      console.error("Failed to send leads/approved to Inngest", error);
      return NextResponse.json(
        { error: "Couldn't restart drafting — try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
