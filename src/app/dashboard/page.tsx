import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Headset, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listEmployees, ROLE_LABELS } from "@/lib/employees";
import { Badge, Card, EmployeeAvatar, Eyebrow, Heading, Text } from "@/components/atoms";
import AppHeader from "@/components/organisms/AppHeader";
import HireRoleButton from "@/components/organisms/HireRoleButton";

const COMING_SOON_ROLES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Sales Ops Analyst",
    description: "Keeps your pipeline data clean and flags deals that need attention.",
    icon: BarChart3,
  },
  {
    title: "Customer Success Rep",
    description: "Checks in with customers and drafts renewal and upsell outreach.",
    icon: Headset,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const employees = await listEmployees(supabase, user.id);
  const leadSourcer = employees.find((e) => e.role === "lead_sourcer");

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AppHeader />
      <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
        <section className="space-y-4">
          <Heading as="h1" size="lg">
            Your team
          </Heading>
          <div className="grid gap-4 sm:grid-cols-2">
            {employees.map((employee) => {
              const href =
                employee.status === "onboarding"
                  ? `/employee/${employee.id}/onboarding`
                  : `/employee/${employee.id}`;
              return (
                <Link key={employee.id} href={href}>
                  <Card
                    padding="lg"
                    className="transition hover:border-gray-400"
                  >
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar seed={employee.id} size="md" />
                      <div>
                        <Text size="md" weight="semibold">
                          {ROLE_LABELS[employee.role]}
                        </Text>
                        <Text size="sm" tone="muted">
                          {employee.role === "account_manager"
                            ? "Account Manager"
                            : "Lead Sourcer"}
                        </Text>
                      </div>
                      <Badge
                        tone={
                          employee.status === "active" ? "accent" : "neutral"
                        }
                        size="sm"
                        className="ml-auto"
                      >
                        {employee.status === "active"
                          ? "Active"
                          : "Onboarding"}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <Eyebrow>Hire</Eyebrow>
            <Heading as="h2" size="lg" className="mt-1">
              Choose a role to hire
            </Heading>
            <Text size="sm" tone="muted" className="mt-2 max-w-xl">
              Every employee comes with a clear job description and a
              dashboard where you review their work.
            </Text>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {leadSourcer ? (
              <Link
                href={
                  leadSourcer.status === "onboarding"
                    ? `/employee/${leadSourcer.id}/onboarding`
                    : `/employee/${leadSourcer.id}`
                }
              >
                <Card padding="lg" className="h-full transition hover:border-gray-400">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-(--accent-soft)">
                    <Target size={20} className="text-(--accent)" />
                  </div>
                  <Eyebrow className="mt-4">Hired</Eyebrow>
                  <Text size="lg" weight="semibold" className="mt-3">
                    Lead Sourcer
                  </Text>
                  <Text size="sm" tone="muted" className="mt-1.5">
                    Emma is researching prospects and drafting outreach.
                  </Text>
                </Card>
              </Link>
            ) : (
              <HireRoleButton
                role="lead_sourcer"
                title="Lead Sourcer"
                description="Researches prospects and drafts personalized outreach emails for your approval."
                icon={Target}
              />
            )}

            {COMING_SOON_ROLES.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                padding="lg"
                className="cursor-not-allowed bg-gray-50 text-left opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-200">
                  <Icon size={20} className="text-gray-500" />
                </div>
                <Eyebrow tone="muted" className="mt-4">
                  Coming soon
                </Eyebrow>
                <Text size="lg" weight="semibold" className="mt-3 text-gray-700!">
                  {title}
                </Text>
                <Text size="sm" tone="muted" className="mt-1.5">
                  {description}
                </Text>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
