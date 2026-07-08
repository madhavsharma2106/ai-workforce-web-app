import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById, markEmployeeActive } from "@/lib/employees";
import { buildFirstDay, searchLeadsForClient } from "@/lib/leadSearch";
import {
  ApolloConfigError,
  ApolloRequestError,
} from "@/lib/integrations/apollo";

type Params = { params: Promise<{ id: string }> };

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

  const body = await request.json();
  const answers: Record<string, string> = body.answers ?? {};

  if (employee.role === "account_manager") {
    const sections = [
      "## Business",
      answers.businessDescription || "(not provided)",
      "",
      "## Ideal client",
      answers.idealClient || "(not provided)",
      "",
      "## Bad-fit criteria",
      answers.badLeadCriteria || "(not provided)",
      "",
      "## Value proposition",
      answers.valueProp || "(not provided)",
      "",
      "## Tone",
      answers.tone || "(not provided)",
    ];

    if (answers.priorities) {
      sections.push("", "## Current priorities", answers.priorities);
    }
    if (answers.dosDonts) {
      sections.push("", "## Do's and don'ts", answers.dosDonts);
    }

    const profileMd = sections.join("\n");

    await supabase.from("business_profiles").upsert({
      user_id: user.id,
      business_name: answers.businessName || null,
      profile_md: profileMd,
      contact_name: answers.name || null,
      updated_at: new Date().toISOString(),
    });

    await markEmployeeActive(supabase, id);
    return NextResponse.json({ redirectTo: "/dashboard" });
  }

  // lead_sourcer
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
