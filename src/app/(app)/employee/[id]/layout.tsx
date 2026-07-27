import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee } from "@/lib/employees";
import { EmployeeChatSidebar } from "@/components/organisms";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
} & Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { employee } = await requireOwnedEmployee(supabase, id);

  if (employee.status === "onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="flex items-start">
      <div className="min-w-0 flex-1">{children}</div>
      <EmployeeChatSidebar employeeId={employee.id} role={employee.role} />
    </div>
  );
}
