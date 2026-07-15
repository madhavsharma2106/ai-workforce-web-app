import type { SupabaseClient, User } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { requireUser, requireUserForApi } from "@/lib/supabase/auth";

export type EmployeeRole =
  "account_manager" | "lead_sourcer" | "sales_representative";
export type EmployeeStatus = "onboarding" | "active";

export type Employee = {
  id: string;
  user_id: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  instructions_md: string | null;
  created_at: string;
};

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  account_manager: "Alex",
  lead_sourcer: "Emma",
  sales_representative: "Oliver",
};

export const ROLE_TITLES: Record<EmployeeRole, string> = {
  account_manager: "Account Manager",
  lead_sourcer: "Lead Sourcer",
  sales_representative: "Sales Representative",
};

export async function getAccountManager(
  supabase: SupabaseClient,
  userId: string,
): Promise<Employee | null> {
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "account_manager")
    .maybeSingle();

  return data as Employee | null;
}

export async function getEmployeeById(
  supabase: SupabaseClient,
  id: string,
): Promise<Employee | null> {
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as Employee | null;
}

export async function requireOwnedEmployee(
  supabase: SupabaseClient,
  id: string,
): Promise<{ user: User; employee: Employee }> {
  const user = await requireUser(supabase);

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    notFound();
  }

  return { user, employee };
}

export async function requireOwnedEmployeeForApi(
  supabase: SupabaseClient,
  id: string,
): Promise<{ user: User; employee: Employee } | NextResponse> {
  const user = await requireUserForApi(supabase);
  if (user instanceof NextResponse) return user;

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return { user, employee };
}

export async function listEmployees(
  supabase: SupabaseClient,
  userId: string,
): Promise<Employee[]> {
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data as Employee[] | null) ?? [];
}

export async function createEmployee(
  supabase: SupabaseClient,
  userId: string,
  role: EmployeeRole,
): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .insert({ user_id: userId, role })
    .select("*")
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function markEmployeeActive(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  await supabase.from("employees").update({ status: "active" }).eq("id", id);
}
