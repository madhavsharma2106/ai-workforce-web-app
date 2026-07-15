import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

export async function PATCH(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user, employee } = result;
  if (employee.role !== "account_manager") {
    return NextResponse.json(
      { error: "Not an account manager" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const businessName: string = body.businessName ?? "";
    const contactName: string = body.contactName ?? "";
    const profileMd: string = body.profileMd ?? "";

    const { data: profile, error } = await supabase
      .from("business_profiles")
      .upsert({
        user_id: user.id,
        business_name: businessName || null,
        profile_md: profileMd,
        contact_name: contactName || null,
        updated_at: new Date().toISOString(),
      })
      .select("business_name, profile_md, contact_name, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
