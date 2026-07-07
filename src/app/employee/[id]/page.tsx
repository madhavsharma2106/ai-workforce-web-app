import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById } from "@/lib/employees";
import { Card, Eyebrow, Heading, Text } from "@/components/atoms";
import AppHeader from "@/components/organisms/AppHeader";
import LeadSourcerHome from "@/components/organisms/LeadSourcerHome";

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {employee.role === "lead_sourcer" ? (
          <LeadSourcerHome employeeId={employee.id} />
        ) : (
          <Card as="section" padding="lg">
            <Eyebrow>Alex</Eyebrow>
            <Heading as="h2" size="md" className="mt-1">
              Maintaining your Business Profile
            </Heading>
            <Text size="sm" tone="muted" className="mt-2">
              Nothing to review yet — Alex checks in as your business
              changes.
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
