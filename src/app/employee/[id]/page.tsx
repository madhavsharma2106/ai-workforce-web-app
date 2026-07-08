import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById, listEmployees } from "@/lib/employees";
import AppHeader from "@/components/organisms/AppHeader";
import LeadSourcerHome from "@/components/organisms/LeadSourcerHome";
import AccountManagerHome from "@/components/organisms/AccountManagerHome";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeHomePage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const employee = await getEmployeeById(supabase, id);
  if (!employee || employee.user_id !== user.id) {
    notFound();
  }

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
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {employee.role === "lead_sourcer" ? (
          <LeadSourcerHome employeeId={employee.id} />
        ) : (
          accountManagerContent
        )}
      </div>
    </div>
  );
}
