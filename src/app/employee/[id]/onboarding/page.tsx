import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById, ROLE_LABELS } from "@/lib/employees";
import { Eyebrow, Heading } from "@/components/atoms";
import AppHeader from "@/components/organisms/AppHeader";
import EmployeeOnboarding from "@/components/organisms/EmployeeOnboarding";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeOnboardingPage({ params }: Params) {
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

  if (employee.status !== "onboarding") {
    redirect(`/employee/${id}`);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <div>
          <Eyebrow>Onboarding</Eyebrow>
          <Heading as="h1" size="lg" className="mt-1">
            Onboard {ROLE_LABELS[employee.role]}
          </Heading>
        </div>
        <EmployeeOnboarding employeeId={employee.id} role={employee.role} />
      </div>
    </div>
  );
}
