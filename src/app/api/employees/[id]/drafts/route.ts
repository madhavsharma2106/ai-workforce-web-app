import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployeeForApi } from "@/lib/employees";
import { getLeadsAwaitingOutreach } from "@/lib/leads";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const result = await requireOwnedEmployeeForApi(supabase, id);
  if (result instanceof NextResponse) return result;
  const { user } = result;

  const leads = await getLeadsAwaitingOutreach(supabase, { userId: user.id });

  return NextResponse.json({ leads });
}
