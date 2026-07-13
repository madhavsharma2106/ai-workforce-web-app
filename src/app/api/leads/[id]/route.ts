import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { updateLeadDraft, updateLeadDraftStatus, updateLeadFeedback, updateLeadStatus } from "@/lib/leads";
import { listEmployees } from "@/lib/employees";
import { inngest } from "@/lib/inngest/client";
import type { ApprovalStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected"];

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const body = await request.json().catch(() => ({}));
  const { status, draftStatus, draft, feedbackReason } = body as {
    status?: ApprovalStatus;
    draftStatus?: ApprovalStatus;
    draft?: string;
    feedbackReason?: string;
  };

  if (status !== undefined && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (draftStatus !== undefined && !STATUSES.includes(draftStatus)) {
    return NextResponse.json({ error: "Invalid draftStatus" }, { status: 400 });
  }

  if (status === "approved") {
    const employees = await listEmployees(supabase, user.id);
    if (!employees.some((e) => e.role === "sales_representative")) {
      return NextResponse.json(
        { error: "Hire Oliver (Sales Representative) before approving leads for outreach." },
        { status: 400 },
      );
    }

    // Conditional update: only actually flips (and fires the handoff) if the
    // lead was still pending, so a duplicate/retried approve doesn't spawn a
    // second Oliver run.
    const { data: changed } = await supabase
      .from("leads")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select("id");

    if (changed && changed.length > 0) {
      await inngest.send({ name: "leads/approved", data: { userId: user.id, leadId: id } });
    }
  } else if (status !== undefined) {
    await updateLeadStatus(supabase, { id, userId: user.id, status });
  }

  if (draftStatus !== undefined) {
    await updateLeadDraftStatus(supabase, { id, userId: user.id, status: draftStatus });
  }
  if (draft !== undefined) {
    await updateLeadDraft(supabase, { id, userId: user.id, draft });
  }
  if (feedbackReason !== undefined) {
    await updateLeadFeedback(supabase, { id, userId: user.id, feedbackReason });
  }

  return NextResponse.json({ status: "ok" });
}
