import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee, ROLE_LABELS } from "@/lib/employees";
import { Breadcrumb, Eyebrow, Heading } from "@/components/atoms";
import EmployeeOnboarding from "@/components/organisms/EmployeeOnboarding";

type Params = { params: Promise<{ id: string }> };

export default async function EmployeeOnboardingPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { employee } = await requireOwnedEmployee(supabase, id);

  if (employee.status !== "onboarding") {
    redirect(`/employee/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }]} />
      <div>
        <Eyebrow>Onboarding</Eyebrow>
        <Heading as="h1" size="lg" className="mt-1">
          Onboard {ROLE_LABELS[employee.role]}
        </Heading>
      </div>
      <EmployeeOnboarding employeeId={employee.id} role={employee.role} />
    </div>
  );
}
