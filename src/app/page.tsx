import Link from "next/link";
import { Briefcase, Target, Users } from "lucide-react";
import { Card, Eyebrow, Heading, Text } from "@/components/atoms";

const ROLES = [
  {
    icon: <Briefcase size={20} />,
    name: "Alex",
    title: "Account Manager",
    description:
      "Learns your business so every other employee produces more relevant work.",
  },
  {
    icon: <Target size={20} />,
    name: "Emma",
    title: "Lead Sourcer",
    description:
      "Researches prospects and drafts personalized outreach for your approval.",
  },
  {
    icon: <Users size={20} />,
    name: "Oliver",
    title: "Sales Representative",
    description:
      "Sends approved outreach and follows up until leads become conversations.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-6 py-16">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <Eyebrow className="mx-auto">New era of work</Eyebrow>
        <Heading as="h1" size="xl">
          Hire AI employees that work every morning.
        </Heading>
        <Text size="lg" tone="muted" className="mx-auto max-w-lg">
          Your first employee learns your business, then sources leads, drafts
          outreach, and waits for your approval.
        </Text>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="rounded-full bg-(--accent) px-6 py-3 text-sm font-bold text-white transition hover:bg-(--accent-hover)"
          >
            Hire your first employee
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <Card key={role.title} padding="lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--accent-soft) text-(--accent-soft-text)">
              {role.icon}
            </div>
            <Text size="md" weight="semibold" className="mt-4">
              {role.name}
            </Text>
            <Text size="sm" tone="muted" className="mt-0.5">
              {role.title}
            </Text>
            <Text size="sm" tone="muted" className="mt-3">
              {role.description}
            </Text>
          </Card>
        ))}
      </section>
    </div>
  );
}
