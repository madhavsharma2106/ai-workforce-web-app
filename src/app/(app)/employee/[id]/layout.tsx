import { createClient } from "@/lib/supabase/server";
import { requireOwnedEmployee } from "@/lib/employees";
import { getChatMessages } from "@/lib/knowledgeChat";
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

  const initialMessages = await getChatMessages(supabase, employee.id);

  return (
    <>
      {children}
      <EmployeeChatSidebar
        employeeId={employee.id}
        role={employee.role}
        initialMessages={initialMessages}
      />
    </>
  );
}
