import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import {
  generateNextQuestion,
  type OnboardingTranscriptEntry,
} from "@/lib/onboardingQuestions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;

  const body = await request.json();
  const transcript: OnboardingTranscriptEntry[] = body.transcript ?? [];

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("profile_md")
    .eq("user_id", user.id)
    .maybeSingle();

  const next = await generateNextQuestion({
    role: employee.role,
    transcript,
    knownProfile: profile?.profile_md || null,
  });

  return NextResponse.json(next);
}
