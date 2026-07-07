import type { SupabaseClient } from "@supabase/supabase-js";

export type EmployeeRole = "account_manager" | "lead_sourcer";
export type EmployeeStatus = "onboarding" | "active";

export type Employee = {
  id: string;
  user_id: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  created_at: string;
};

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  account_manager: "Alex",
  lead_sourcer: "Emma",
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
