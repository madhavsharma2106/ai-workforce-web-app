"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AuthGate from "@/components/organisms/AuthGate";
import LeadCard from "@/components/organisms/LeadCard";
import ConversationalForm, {
  ConversationalFormQuestion,
} from "@/components/organisms/ConversationalForm";
import { createClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types";
import { Badge, Button, Card, Eyebrow, Heading, Text } from "@/components/atoms";
import { Alert } from "@/components/molecules";

type ApprovalStatus = "pending" | "approved" | "rejected";

type Day = {
  id: number;
  dateLabel: string;
  leads: Lead[];
  statuses: Record<number, ApprovalStatus>;
  drafts: Record<number, string>;
  feedback: Record<number, string>;
  standup: string;
  learned: string;
  researched: number;
};

const defaultBadLeadCriteria =
  "companies that already have strong video case studies, agencies, or consumer brands";

type OnboardingResult = {
  clientDescription: string;
  badLeadCriteria: string;
  name: string;
};

const emmaOnboardingQuestions: ConversationalFormQuestion[] = [
  {
    key: "clientDescription",
    prompt:
      "Hi, I'm Emma — I'll be sourcing leads and drafting outreach for you. First: what does your ideal client look like?",
    placeholder: "e.g. B2B SaaS companies with weak video presence...",
    chips: [
      "B2B SaaS companies with weak online presence",
      "Local service businesses ready to grow",
      "E-commerce brands scaling past $1M",
    ],
  },
  {
    key: "badLeadCriteria",
    prompt:
      "Good to know. And what should I steer clear of — what does a bad-fit lead look like?",
    placeholder: "e.g. Agencies, consumer brands, companies too small...",
    chips: [
      "Agencies and consultants",
      "Companies too small to afford us",
      "Already working with a competitor",
    ],
  },
  {
    key: "name",
    prompt: "Last thing — what should I call you?",
    placeholder: "Your name (optional)",
    optional: true,
  },
];

function formatDateLabel(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function initStatuses(leads: Lead[]) {
  return leads.reduce(
    (acc, lead) => ({ ...acc, [lead.id]: "pending" as ApprovalStatus }),
    {} as Record<number, ApprovalStatus>,
  );
}

function initDrafts(leads: Lead[]) {
  return leads.reduce(
    (acc, lead) => ({ ...acc, [lead.id]: lead.draft }),
    {} as Record<number, string>,
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [screen, setScreen] = useState<
    "welcome" | "role" | "onboarding" | "dashboard"
  >("welcome");
  const [profile, setProfile] = useState<OnboardingResult | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<number | null>(null);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(
    null,
  );
  const [revealingLeadId, setRevealingLeadId] = useState<number | null>(null);

  const currentDay = days[days.length - 1];

  const approvedCount = useMemo(
    () =>
      currentDay
        ? Object.values(currentDay.statuses).filter(
            (status) => status === "approved",
          ).length
        : 0,
    [currentDay],
  );

  const pendingCount = useMemo(
    () =>
      currentDay
        ? Object.values(currentDay.statuses).filter(
            (status) => status === "pending",
          ).length
        : 0,
    [currentDay],
  );

  const clearLocalState = () => {
    setScreen("welcome");
    setProfile(null);
    setDays([]);
    setEditingLeadId(null);
    setFeedbackLeadId(null);
  };

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLocalState();
  };

  const updateCurrentDay = (updater: (day: Day) => Day) => {
    setDays((current) =>
      current.map((day, index) =>
        index === current.length - 1 ? updater(day) : day,
      ),
    );
  };

  const handleOnboardingComplete = async (result: OnboardingResult) => {
    setProfile(result);
    setSearchState("loading");
    setSearchErrorMessage(null);
    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDescription: result.clientDescription,
          badLeadCriteria: result.badLeadCriteria,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Lead search failed.");
      }

      const leads: Lead[] = data.leads;
      const day1: Day = {
        id: 1,
        dateLabel: formatDateLabel(0),
        leads,
        statuses: initStatuses(leads),
        drafts: initDrafts(leads),
        feedback: {},
        standup: `Good morning${result.name ? `, ${result.name}` : ""}. I found ${leads.length} qualified leads today and prepared personalized emails for review.`,
        learned:
          "This is my first day on the job — every approval or rejection you give me will sharpen tomorrow's picks.",
        researched: data.researched ?? leads.length,
      };
      setDays([day1]);
      setSearchState("idle");
      setScreen("dashboard");
    } catch (error) {
      setSearchState("error");
      setSearchErrorMessage(
        error instanceof Error ? error.message : "Lead search failed.",
      );
    }
  };

  const handleRevealEmail = async (id: number) => {
    const lead = currentDay?.leads.find((l) => l.id === id);
    if (!lead || !lead.personId || lead.emailRevealed) return;

    setRevealingLeadId(id);
    try {
      const response = await fetch("/api/leads/reveal-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: lead.personId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to reveal email.");
      }
      updateCurrentDay((day) => ({
        ...day,
        leads: day.leads.map((l) =>
          l.id === id
            ? { ...l, email: data.email ?? l.email, emailRevealed: true }
            : l,
        ),
      }));
    } catch {
      // Reveal is a secondary action — leave the lead locked and let the
      // user retry rather than surfacing a blocking error.
    } finally {
      setRevealingLeadId(null);
    }
  };

  const handleApprove = (id: number) => {
    updateCurrentDay((day) => ({
      ...day,
      statuses: { ...day.statuses, [id]: "approved" },
    }));
    if (feedbackLeadId === id) setFeedbackLeadId(null);
    void handleRevealEmail(id);
  };

  const handleReject = (id: number) => {
    updateCurrentDay((day) => ({
      ...day,
      statuses: { ...day.statuses, [id]: "rejected" },
    }));
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleApproveAll = () => {
    updateCurrentDay((day) => {
      const nextStatuses = { ...day.statuses };
      day.leads.forEach((lead) => {
        if (nextStatuses[lead.id] === "pending")
          nextStatuses[lead.id] = "approved";
      });
      return { ...day, statuses: nextStatuses };
    });
    setFeedbackLeadId(null);
  };

  const handleDraftChange = (id: number, value: string) => {
    updateCurrentDay((day) => ({
      ...day,
      drafts: { ...day.drafts, [id]: value },
    }));
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    updateCurrentDay((day) => ({
      ...day,
      feedback: { ...day.feedback, [feedbackLeadId]: reason },
    }));
    setFeedbackLeadId(null);
  };

  if (user === undefined) {
    return <div className="min-h-screen bg-white" />;
  }

  if (user === null) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-sm font-semibold text-white">
              W
            </div>
            <Text size="sm" weight="semibold" className="tracking-tight">
              Workforce
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {screen === "welcome" && (
          <main className="space-y-20">
            {/* Hero section */}
            <section className="border-b border-gray-200 pb-16 pt-8">
              <div className="mx-auto max-w-2xl space-y-6 text-center">
                <Eyebrow>New era of work</Eyebrow>
                <Heading as="h1" size="xl">
                  Hire AI employees that work every morning.
                </Heading>
                <Text size="lg" tone="muted" className="mx-auto max-w-lg">
                  Your first employee sources leads, drafts outreach, and waits
                  for your approval.
                </Text>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <Button size="lg" onClick={() => setScreen("role")}>
                    Hire your first employee
                  </Button>
                </div>
              </div>
            </section>

            {/* Feature cards */}
            <section className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-3">
              {[
                {
                  label: "Meet Emma",
                  desc: "Lead Sourcer focused on finding fast-fit opportunities.",
                },
                {
                  label: "Daily Reports",
                  desc: "See what she found, learned, and recommends.",
                },
                {
                  label: "Approval Queue",
                  desc: "Review leads before Emma sends any outreach.",
                },
              ].map((feature) => (
                <article key={feature.label} className="bg-white p-8">
                  <Eyebrow>{feature.label}</Eyebrow>
                  <Text size="md" weight="medium" className="mt-3">
                    {feature.desc}
                  </Text>
                </article>
              ))}
            </section>
          </main>
        )}

        {screen === "role" && (
          <main className="space-y-8">
            <div>
              <Eyebrow>Step 1</Eyebrow>
              <Heading as="h2" size="lg" className="mt-1">
                Choose a role to hire
              </Heading>
              <Text size="sm" tone="muted" className="mt-2 max-w-xl">
                Every employee comes with a clear job description and a
                dashboard where you review their work.
              </Text>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setScreen("onboarding")}
                className="rounded-lg border border-gray-900 bg-gray-900 p-6 text-left text-white transition hover:bg-gray-700"
              >
                <Eyebrow tone="accent-faint">Available now</Eyebrow>
                <Text size="lg" weight="semibold" className="mt-3 text-white!">
                  Lead Sourcer
                </Text>
                <Text size="sm" tone="inverted" className="mt-1.5">
                  Researches prospects and drafts personalized outreach
                  emails for your approval.
                </Text>
              </button>

              {["Sales Ops Analyst", "Customer Success Rep"].map((role) => (
                <Card
                  key={role}
                  padding="lg"
                  className="cursor-not-allowed bg-gray-50 text-left opacity-60"
                >
                  <Eyebrow tone="muted">Coming soon</Eyebrow>
                  <Text
                    size="lg"
                    weight="semibold"
                    className="mt-3 text-gray-700!"
                  >
                    {role}
                  </Text>
                </Card>
              ))}
            </div>
          </main>
        )}

        {screen === "onboarding" && (
          <main className="space-y-8">
            <div>
              <Eyebrow>Step 2</Eyebrow>
              <Heading as="h2" size="lg" className="mt-1">
                Onboard Emma
              </Heading>
            </div>

            {searchState === "loading" && (
              <Alert variant="info">
                Searching Apollo for leads that match your ICP…
              </Alert>
            )}

            {searchState === "error" && (
              <Alert variant="error">
                {searchErrorMessage ?? "Lead search failed."}
              </Alert>
            )}

            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <ConversationalForm
                agentName="Emma"
                questions={emmaOnboardingQuestions}
                confirmLabel="Confirm hire →"
                onComplete={(answers) =>
                  handleOnboardingComplete({
                    clientDescription: answers.clientDescription ?? "",
                    badLeadCriteria: answers.badLeadCriteria ?? "",
                    name: answers.name ?? "",
                  })
                }
              />

              <Card as="section" padding="lg" className="bg-gray-50">
                <Eyebrow>Emma&apos;s profile</Eyebrow>
                <div className="mt-4 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white">
                      E
                    </div>
                    <div>
                      <Text size="md" weight="semibold">
                        Emma
                      </Text>
                      <Text size="sm" tone="muted">
                        Lead Sourcer & Outreach Specialist
                      </Text>
                    </div>
                  </div>

                  <Text size="sm" tone="subtle">
                    Researches prospects, identifies fast-fit opportunities,
                    and personalizes outreach emails. Learns from your
                    feedback daily.
                  </Text>

                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <Eyebrow tone="muted">Key abilities</Eyebrow>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Research",
                        "Analysis",
                        "Personalization",
                        "Learning",
                      ].map((ability) => (
                        <Badge key={ability} tone="accent">
                          {ability}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-200 pt-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Works 24/7 on your criteria</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Never sends without approval</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-600">✓</span>
                      <span>Improves with every rejection</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        )}

        {screen === "dashboard" && currentDay && (
          <main className="space-y-10">
            {/* Employee status card */}
            <Card as="section" padding="lg">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white">
                    E
                  </div>
                  <div>
                    <Eyebrow>
                      Active employee · Day {currentDay.id} ·{" "}
                      {currentDay.dateLabel}
                    </Eyebrow>
                    <Heading as="h2" size="md" className="mt-1">
                      Emma is working
                    </Heading>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="accent" size="md">
                    {pendingCount > 0
                      ? "Waiting for approval"
                      : "All caught up"}
                  </Badge>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Researched",
                    value: `${currentDay.researched} companies`,
                  },
                  {
                    label: "Qualified",
                    value: `${currentDay.leads.length} leads`,
                  },
                  {
                    label: "Drafted",
                    value: `${currentDay.leads.length} emails`,
                  },
                  { label: "In queue", value: `${pendingCount} for review` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-5">
                    <Text size="xs" tone="muted" weight="medium">
                      {stat.label}
                    </Text>
                    <Text
                      size="xl"
                      weight="semibold"
                      className="mt-2 font-mono"
                    >
                      {stat.value}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>

            {/* Standup section */}
            <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <Card as="article" padding="lg">
                <Eyebrow>Daily standup</Eyebrow>
                <blockquote className="mt-4 border-l-2 border-gray-900 pl-4">
                  <Text size="lg">{currentDay.standup}</Text>
                </blockquote>
              </Card>

              <article className="space-y-3">
                <Card padding="sm">
                  <Eyebrow tone="muted">What I learned</Eyebrow>
                  <Text size="sm" tone="subtle" className="mt-2">
                    {currentDay.learned}
                  </Text>
                </Card>
                <Card padding="sm">
                  <Eyebrow tone="muted">What I&apos;m avoiding</Eyebrow>
                  <Text size="sm" tone="subtle" className="mt-2">
                    {profile?.badLeadCriteria || defaultBadLeadCriteria}
                  </Text>
                </Card>
              </article>
            </section>

            {/* Approval queue */}
            <Card as="section" padding="lg" className="space-y-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <Eyebrow>Step 3</Eyebrow>
                  <Heading as="h3" size="md" className="mt-1">
                    Review & approve leads
                  </Heading>
                </div>
                <Button className="px-4!" onClick={handleApproveAll}>
                  Approve all
                </Button>
              </div>

              <div className="grid gap-4">
                {currentDay.leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    status={currentDay.statuses[lead.id]}
                    draftText={currentDay.drafts[lead.id]}
                    isEditing={editingLeadId === lead.id}
                    feedbackActive={feedbackLeadId === lead.id}
                    feedbackReason={currentDay.feedback[lead.id]}
                    onApprove={() => handleApprove(lead.id)}
                    onReject={() => handleReject(lead.id)}
                    onRevealEmail={() => handleRevealEmail(lead.id)}
                    isRevealingEmail={revealingLeadId === lead.id}
                    onToggleEdit={() =>
                      setEditingLeadId((current) =>
                        current === lead.id ? null : lead.id,
                      )
                    }
                    onDraftChange={(value) => handleDraftChange(lead.id, value)}
                    onFeedbackSubmit={handleFeedbackSubmit}
                  />
                ))}
              </div>

              {/* Progress footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-50 p-5">
                <div>
                  <Text size="sm" weight="medium">
                    Approval progress
                  </Text>
                  <Text size="sm" tone="muted" className="mt-0.5">
                    {approvedCount} approved • {pendingCount} pending
                  </Text>
                </div>
                <Badge tone="accent" size="sm" className="bg-white! shadow-sm">
                  Emma is learning from your feedback
                </Badge>
              </div>
            </Card>
          </main>
        )}
      </div>
    </div>
  );
}
