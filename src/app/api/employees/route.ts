import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEmployee, type EmployeeRole } from "@/lib/employees";

const HIREABLE_ROLES: EmployeeRole[] = ["lead_sourcer"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const role = body.role as EmployeeRole;

  if (!HIREABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const employee = await createEmployee(supabase, user.id, role);
  return NextResponse.json({ id: employee.id });
}
