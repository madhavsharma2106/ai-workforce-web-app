import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee, listEmployees, ROLE_LABELS } from "@/lib/employees";
import { Breadcrumb } from "@/components/atoms";
import LeadSourcerHome from "@/components/organisms/LeadSourcerHome";
import AccountManagerHome from "@/components/organisms/AccountManagerHome";
import SalesRepresentativeHome from "@/components/organisms/SalesRepresentativeHome";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeHomePage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, employee } = await requireOwnedEmployee(supabase, id);

  if (employee.status === "onboarding") {
    redirect(`/employee/${id}/onboarding`);
  }

  let accountManagerContent = null;
  if (employee.role === "account_manager") {
    const [{ data: profile }, otherEmployees] = await Promise.all([
      supabase
        .from("business_profiles")
        .select("business_name, contact_name, profile_md, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      listEmployees(supabase, user.id),
    ]);

    accountManagerContent = (
      <AccountManagerHome
        employeeId={employee.id}
        businessName={profile?.business_name ?? null}
        contactName={profile?.contact_name ?? null}
        profileMd={profile?.profile_md ?? ""}
        updatedAt={profile?.updated_at ?? null}
        otherEmployees={otherEmployees.filter((e) => e.id !== employee.id)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: ROLE_LABELS[employee.role] },
        ]}
      />
      {employee.role === "lead_sourcer" ? (
        <LeadSourcerHome employeeId={employee.id} />
      ) : employee.role === "sales_representative" ? (
        <SalesRepresentativeHome employeeId={employee.id} />
      ) : (
        accountManagerContent
      )}
    </div>
  );
}
