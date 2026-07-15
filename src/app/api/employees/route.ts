import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUserForApi } from "@/lib/supabase/auth";
import { createEmployee, type EmployeeRole } from "@/lib/employees";
import { apiErrorResponse } from "@/lib/api/errors";

const HIREABLE_ROLES: EmployeeRole[] = ["lead_sourcer", "sales_representative"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const body = await request.json();
  const role = body.role as EmployeeRole;

  if (!HIREABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const employee = await createEmployee(supabase, user.id, role);
    return NextResponse.json({ id: employee.id });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
