import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { getLeadsAwaitingOutreach } from "@/lib/leads";
import type { IdRouteParams } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api/errors";

export async function GET(request: Request, { params }: IdRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user } = result;

  try {
    const leads = await getLeadsAwaitingOutreach(supabase, { userId: user.id });
    return NextResponse.json({ leads });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
