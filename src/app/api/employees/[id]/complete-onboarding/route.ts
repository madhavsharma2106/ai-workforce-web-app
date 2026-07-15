import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  markEmployeeActive,
  requireOwnedEmployeeForApi,
  type EmployeeRole,
} from "@/lib/employees";
import { synthesizeBusinessProfile } from "@/lib/businessProfile";
import { synthesizeEmployeeInstructions } from "@/lib/employeeInstructions";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";
import { inngest } from "@/lib/inngest/client";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

/**
 * Best-effort: a failed synthesis shouldn't block the employee from going
 * active, it just means the founder starts with an empty Instructions note
 * instead of a pre-filled one.
 */
async function saveEmployeeInstructions(
  supabase: SupabaseClient,
  input: {
    role: EmployeeRole;
    id: string;
    transcript: OnboardingTranscriptEntry[];
  },
): Promise<void> {
  const { role, id, transcript } = input;
  try {
    const { instructionsMd } = await synthesizeEmployeeInstructions({
      role,
      transcript,
    });
    await supabase
      .from("employees")
      .update({ instructions_md: instructionsMd || null })
      .eq("id", id);
  } catch {
    // Leave instructions_md unset — the founder can still fill it in from the employee's page.
  }
}

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
      await saveEmployeeInstructions(supabase, {
        role: employee.role,
        id,
        transcript,
      });
      await markEmployeeActive(supabase, id);
      return NextResponse.json({ redirectTo: `/employee/${id}` });
    }

    if (employee.role === "lead_sourcer") {
      await saveEmployeeInstructions(supabase, {
        role: employee.role,
        id,
        transcript,
      });
      await markEmployeeActive(supabase, id);
      try {
        await inngest.send({
          name: "employee/run.requested",
          data: {
            userId: user.id,
            initiatingRole: "lead_sourcer",
            message: "Run your first lead search.",
          },
        });
      } catch (error) {
        // Best-effort, same as instructions synthesis above — the founder can
        // trigger a search manually from the employee page if this fails.
        console.error(
          "Failed to send employee/run.requested to Inngest",
          error,
        );
      }
      return NextResponse.json({ redirectTo: `/employee/${id}` });
    }

    return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
