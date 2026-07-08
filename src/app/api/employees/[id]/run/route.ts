import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById } from "@/lib/employees";
import { inngest } from "@/lib/inngest/client";

type Params = { params: Promise<{ id: string }> };

/**
 * Manually kicks off a background employee run — a debug entry point for
 * verifying the LangGraph delegation graph + Inngest plumbing (see
 * docs/AGENTS.md) without needing the Inngest dev dashboard.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const message: string = body.message || "Give me a status update.";

  await inngest.send({
    name: "employee/run.requested",
    data: { userId: user.id, initiatingRole: employee.role, message },
  });

  return NextResponse.json({ status: "queued" });
}
