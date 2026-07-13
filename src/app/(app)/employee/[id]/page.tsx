import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee, ROLE_LABELS, type EmployeeRole } from "@/lib/employees";
import { Breadcrumb } from "@/components/atoms";
import LeadSourcerHomeContainer from "@/components/organisms/LeadSourcerHomeContainer";
import AccountManagerHomeContainer from "@/components/organisms/AccountManagerHomeContainer";
import SalesRepresentativeHomeContainer from "@/components/organisms/SalesRepresentativeHomeContainer";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeHomePage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, employee } = await requireOwnedEmployee(supabase, id);

  if (employee.status === "onboarding") {
    redirect(`/employee/${id}/onboarding`);
  }

  const roleHome: Record<EmployeeRole, React.ReactNode> = {
    lead_sourcer: <LeadSourcerHomeContainer employeeId={employee.id} userId={user.id} />,
    sales_representative: (
      <SalesRepresentativeHomeContainer employeeId={employee.id} userId={user.id} />
    ),
    account_manager: (
      <AccountManagerHomeContainer employeeId={employee.id} userId={user.id} />
    ),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: ROLE_LABELS[employee.role] },
        ]}
      />
      {roleHome[employee.role]}
    </div>
  );
}
