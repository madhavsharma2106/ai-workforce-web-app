import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { inngest } from "@/lib/inngest/client";
import type { IdRouteParams } from "@/lib/types";

/**
 * Manually kicks off a background employee run — a debug entry point for
 * verifying the LangGraph delegation graph + Inngest plumbing (see
 * docs/AGENTS.md) without needing the Inngest dev dashboard.
 */
export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  const body = await request.json().catch(() => ({}));
  const message: string = body.message || "Give me a status update.";

  try {
    await inngest.send({
      name: "employee/run.requested",
      data: { userId: user.id, initiatingRole: employee.role, message },
    });
  } catch (error) {
    console.error("Failed to send employee/run.requested to Inngest", error);
    return NextResponse.json(
      { error: "Couldn't start the run — try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ status: "queued" });
}
