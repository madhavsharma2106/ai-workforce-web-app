import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSearch, Target, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listEmployees, ROLE_LABELS, ROLE_TITLES } from "@/lib/employees";
import { Badge, Card, EmployeeAvatar, Eyebrow, Heading, Text } from "@/components/atoms";
import HireRoleButton from "@/components/organisms/HireRoleButton";

const COMING_SOON_ROLES: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Recruiter",
    description: "Sources and screens candidates for roles you're hiring.",
    icon: UserPlus,
  },
  {
    title: "Research Analyst",
    description: "Digs into markets, competitors, and companies you need briefed on.",
    icon: FileSearch,
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
  const salesRepresentative = employees.find(
    (e) => e.role === "sales_representative",
  );

  return (
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
              icon={<Target size={20} className="text-white" />}
            />
          )}

          {salesRepresentative ? (
            <Link
              href={
                salesRepresentative.status === "onboarding"
                  ? `/employee/${salesRepresentative.id}/onboarding`
                  : `/employee/${salesRepresentative.id}`
              }
            >
              <Card padding="lg" className="h-full transition hover:border-gray-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-(--accent-soft)">
                  <Users size={20} className="text-(--accent)" />
                </div>
                <Eyebrow className="mt-4">Hired</Eyebrow>
                <Text size="lg" weight="semibold" className="mt-3">
                  Sales Representative
                </Text>
                <Text size="sm" tone="muted" className="mt-1.5">
                  Oliver is turning Emma&apos;s outreach into real conversations.
                </Text>
              </Card>
            </Link>
          ) : (
            <HireRoleButton
              role="sales_representative"
              title="Sales Representative"
              description="Sends approved outreach and drafts follow-ups — once Emma hands off qualified leads."
              icon={<Users size={20} className="text-white" />}
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
  );
}
