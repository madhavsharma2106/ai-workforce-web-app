import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { mergeBusinessProfile } from "@/lib/businessProfile";
import { mergeEmployeeInstructions } from "@/lib/employeeInstructions";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

/**
 * Applies a "Check for gaps" conversation to the employee's existing
 * knowledge in place — unlike complete-onboarding, this never touches
 * employee status or redirects; the employee is already active.
 */
export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  try {
    const body = await request.json();
    const transcript: OnboardingTranscriptEntry[] = body.transcript ?? [];

    if (employee.role === "account_manager") {
      const { data: existing } = await supabase
        .from("business_profiles")
        .select("business_name, contact_name, profile_md")
        .eq("user_id", user.id)
        .maybeSingle();

      const existingProfile = {
        businessName: existing?.business_name ?? "",
        contactName: existing?.contact_name ?? "",
        profileMd: existing?.profile_md ?? "",
      };

      if (transcript.length === 0) {
        return NextResponse.json({ businessProfile: existingProfile });
      }

      let merged;
      try {
        merged = await mergeBusinessProfile({ existingProfile, transcript });
      } catch {
        return NextResponse.json(
          { error: "Couldn't update your Business Profile — try again." },
          { status: 500 },
        );
      }

      const { data: profile, error } = await supabase
        .from("business_profiles")
        .upsert({
          user_id: user.id,
          business_name: merged.businessName || null,
          contact_name: merged.contactName || null,
          profile_md: merged.profileMd,
          updated_at: new Date().toISOString(),
        })
        .select("business_name, contact_name, profile_md, updated_at")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        businessProfile: {
          businessName: profile.business_name ?? "",
          contactName: profile.contact_name ?? "",
          profileMd: profile.profile_md ?? "",
          updatedAt: profile.updated_at,
        },
      });
    }

    const existingInstructionsMd = employee.instructions_md || "";

    if (transcript.length === 0) {
      return NextResponse.json({ instructionsMd: existingInstructionsMd });
    }

    let merged;
    try {
      merged = await mergeEmployeeInstructions({
        role: employee.role,
        existingInstructionsMd,
        transcript,
      });
    } catch {
      return NextResponse.json(
        { error: "Couldn't update your instructions — try again." },
        { status: 500 },
      );
    }

    const { data: updated, error } = await supabase
      .from("employees")
      .update({ instructions_md: merged.instructionsMd || null })
      .eq("id", id)
      .select("instructions_md")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ instructionsMd: updated.instructions_md ?? "" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
