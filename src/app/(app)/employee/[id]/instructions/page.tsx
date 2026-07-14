import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee, getAccountManager, ROLE_LABELS } from "@/lib/employees";
import { Breadcrumb } from "@/components/atoms";
import InstructionsPanel from "@/components/organisms/InstructionsPanel";

type Params = { params: Promise<{ id: string }> };

export default async function InstructionsPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { user, employee } = await requireOwnedEmployee(supabase, id);

  if (employee.role === "account_manager") {
    redirect(`/employee/${id}`);
  }

  const accountManager = await getAccountManager(supabase, user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: ROLE_LABELS[employee.role], href: `/employee/${employee.id}` },
          { label: "Instructions" },
        ]}
      />
      <InstructionsPanel
        employeeId={employee.id}
        role={employee.role}
        initialInstructionsMd={employee.instructions_md}
        accountManagerId={accountManager?.id ?? null}
      />
    </div>
  );
}
