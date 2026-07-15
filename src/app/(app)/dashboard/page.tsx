import Link from "next/link";
import { redirect } from "next/navigation";
import { Target, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  createEmployee,
  listEmployees,
  ROLE_LABELS,
  ROLE_TITLES,
} from "@/lib/employees";
import {
  Badge,
  Card,
  EmployeeAvatar,
  Eyebrow,
  Heading,
  Text,
} from "@/components/atoms";
import { HireRoleButton } from "@/components/organisms";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const employees = await listEmployees(supabase, user.id);
  const accountManager = employees.find((e) => e.role === "account_manager");
  if (!accountManager) {
    const employee = await createEmployee(supabase, user.id, "account_manager");
    redirect(`/employee/${employee.id}/onboarding`);
  }

  const leadSourcer = employees.find((e) => e.role === "lead_sourcer");
  const salesRepresentative = employees.find(
    (e) => e.role === "sales_representative",
  );

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      <section className="space-y-4">
        <Heading as="h1" size="lg">
          Welcome to your office.
        </Heading>
        <div className="grid gap-4 sm:grid-cols-2">
          {employees.map((employee) => {
            const href =
              employee.status === "onboarding"
                ? `/employee/${employee.id}/onboarding`
                : `/employee/${employee.id}`;
            return (
              <Link key={employee.id} href={href}>
                <Card padding="lg" className="transition hover:border-gray-400">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar seed={employee.id} size="md" />
                    <div>
                      <Text size="md" weight="semibold">
                        {ROLE_LABELS[employee.role]}
                      </Text>
                      <Text size="sm" tone="muted">
                        {ROLE_TITLES[employee.role]}
                      </Text>
                    </div>
                    <Badge
                      tone={employee.status === "active" ? "accent" : "neutral"}
                      size="sm"
                      className="ml-auto"
                    >
                      {employee.status === "active" ? "Active" : "Onboarding"}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {(!leadSourcer || !salesRepresentative) && (
        <section className="space-y-4">
          <div>
            <Eyebrow>Hire</Eyebrow>
            <Heading as="h2" size="lg" className="mt-1">
              Choose a role to hire
            </Heading>
            <Text size="sm" tone="muted" className="mt-2 max-w-xl">
              Every employee comes with a clear job description and a dashboard
              where you review their work.
            </Text>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {!leadSourcer && (
              <HireRoleButton
                role="lead_sourcer"
                title="Lead Sourcer"
                description="Researches prospects and drafts personalized outreach emails for your approval."
                icon={<Target size={20} className="text-white" />}
              />
            )}

            {!salesRepresentative && (
              <HireRoleButton
                role="sales_representative"
                title="Sales Representative"
                description="Sends approved outreach and drafts follow-ups — once Emma hands off qualified leads."
                icon={<Users size={20} className="text-white" />}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
