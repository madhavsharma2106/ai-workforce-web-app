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
  const { employee } = result;
  if (employee.role === "account_manager") {
    return NextResponse.json(
      { error: "Update the Business Profile instead" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const instructionsMd: string = body.instructionsMd ?? "";

    const { data: updated, error } = await supabase
      .from("employees")
      .update({ instructions_md: instructionsMd || null })
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
