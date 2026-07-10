import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { updateLeadDraft, updateLeadFeedback, updateLeadStatus } from "@/lib/leads";
import type { ApprovalStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected"];

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const body = await request.json().catch(() => ({}));
  const { status, draft, feedbackReason } = body as {
    status?: ApprovalStatus;
    draft?: string;
    feedbackReason?: string;
  };

  if (status !== undefined && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status !== undefined) {
    await updateLeadStatus(supabase, { id, userId: user.id, status });
  }
  if (draft !== undefined) {
    await updateLeadDraft(supabase, { id, userId: user.id, draft });
  }
  if (feedbackReason !== undefined) {
    await updateLeadFeedback(supabase, { id, userId: user.id, feedbackReason });
  }

  return NextResponse.json({ status: "ok" });
}
