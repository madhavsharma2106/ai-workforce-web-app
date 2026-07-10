import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markEmployeeActive, requireOwnedEmployeeForApi } from "@/lib/employees";
import { synthesizeBusinessProfile } from "@/lib/businessProfile";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";
import { inngest } from "@/lib/inngest/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  const body = await request.json();
  const transcript: OnboardingTranscriptEntry[] = body.transcript ?? [];

  if (employee.role === "account_manager") {
    let profile;
    try {
      profile = await synthesizeBusinessProfile({ transcript });
    } catch {
      return NextResponse.json(
        { error: "Couldn't save your Business Profile — try again." },
        { status: 500 },
      );
    }

    await supabase.from("business_profiles").upsert({
      user_id: user.id,
      business_name: profile.businessName || null,
      profile_md: profile.profileMd,
      contact_name: profile.contactName || null,
      updated_at: new Date().toISOString(),
    });

    await markEmployeeActive(supabase, id);
    return NextResponse.json({ redirectTo: "/dashboard" });
  }

  if (employee.role === "sales_representative") {
    await markEmployeeActive(supabase, id);
    return NextResponse.json({ redirectTo: `/employee/${id}` });
  }

  if (employee.role === "lead_sourcer") {
    await markEmployeeActive(supabase, id);
    await inngest.send({
      name: "employee/run.requested",
      data: {
        userId: user.id,
        initiatingRole: "lead_sourcer",
        message: "Run your first lead search.",
      },
    });
    return NextResponse.json({ redirectTo: `/employee/${id}` });
  }

  return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
}
