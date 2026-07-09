import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markEmployeeActive, requireOwnedEmployeeForApi } from "@/lib/employees";
import { buildFirstDay, searchLeadsForClient } from "@/lib/leadSearch";
import { synthesizeBusinessProfile } from "@/lib/businessProfile";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";
import {
  ApolloConfigError,
  ApolloRequestError,
} from "@/lib/integrations/apollo";

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
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("profile_md, contact_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const clientDescription =
      profile?.profile_md ||
      "Small businesses that need outbound sales pipeline.";

    try {
      const { leads, researched } = await searchLeadsForClient(
        clientDescription,
      );
      const day = buildFirstDay(leads, researched, profile?.contact_name ?? "");

      await markEmployeeActive(supabase, id);
      return NextResponse.json({ redirectTo: `/employee/${id}`, day });
    } catch (error) {
      if (error instanceof ApolloConfigError) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (error instanceof ApolloRequestError) {
        return NextResponse.json({ error: error.message }, { status: 502 });
      }
      throw error;
    }
  }

  return NextResponse.json({ error: "Unsupported role" }, { status: 400 });
}
