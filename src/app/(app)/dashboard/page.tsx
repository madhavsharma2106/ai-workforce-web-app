import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Briefcase, Target, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import {
  createEmployee,
  listEmployees,
  ROLE_LABELS,
  ROLE_TITLES,
  type Employee,
  type EmployeeRole,
} from "@/lib/employees";
import { Badge, Card, EmployeeAvatar, Heading, Text } from "@/components/atoms";
import { HireRoleButton } from "@/components/organisms";

const ROLE_ORDER: EmployeeRole[] = [
  "account_manager",
  "lead_sourcer",
  "sales_representative",
];

const ROLE_ICON: Record<EmployeeRole, ReactNode> = {
  account_manager: <Briefcase size={20} />,
  lead_sourcer: <Target size={20} />,
  sales_representative: <Users size={20} />,
};

const ROLE_DESCRIPTION: Record<EmployeeRole, string> = {
  account_manager:
    "Learns your business so every other employee produces more relevant work.",
  lead_sourcer:
    "Researches prospects and drafts personalized outreach emails for your approval.",
  sales_representative:
    "Sends approved outreach and drafts follow-ups — once Emma hands off qualified leads.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const employees = await listEmployees(supabase, user.id);
  const accountManager = employees.find((e) => e.role === "account_manager");
  if (!accountManager) {
    const employee = await createEmployee(supabase, user.id, "account_manager");
    redirect(`/employee/${employee.id}/onboarding`);
  }

  const employeeByRole = new Map<EmployeeRole, Employee>(
    employees.map((employee) => [employee.role, employee]),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      <section className="space-y-4">
        <Heading as="h1" size="lg">
          Welcome to your office.
        </Heading>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLE_ORDER.map((role) => {
            const employee = employeeByRole.get(role);

            if (!employee) {
              return (
                <HireRoleButton
                  key={role}
                  role={role}
                  title={ROLE_TITLES[role]}
                  description={ROLE_DESCRIPTION[role]}
                  icon={ROLE_ICON[role]}
                />
              );
            }

            const href =
              employee.status === "onboarding"
                ? `/employee/${employee.id}/onboarding`
                : `/employee/${employee.id}`;

            return (
              <Link key={employee.id} href={href}>
                <Card
                  padding="lg"
                  className="h-full transition hover:opacity-80"
                >
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
    </div>
  );
}
