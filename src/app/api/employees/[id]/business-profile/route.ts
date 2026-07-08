import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { buildProfileMarkdown } from "@/lib/businessProfile";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;
  if (employee.role !== "account_manager") {
    return NextResponse.json({ error: "Not an account manager" }, { status: 400 });
  }

  const body = await request.json();
  const answers: Record<string, string> = body.answers ?? {};
  const profileMd = buildProfileMarkdown(answers);

  const { data: profile, error } = await supabase
    .from("business_profiles")
    .upsert({
      user_id: user.id,
      business_name: answers.businessName || null,
      profile_md: profileMd,
      contact_name: answers.name || null,
      updated_at: new Date().toISOString(),
    })
    .select("business_name, profile_md, contact_name, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
