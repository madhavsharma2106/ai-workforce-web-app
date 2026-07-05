"use client";

import { useMemo, useState } from "react";
import LeadCard from "@/components/LeadCard";
import OnboardingChat, { OnboardingResult } from "@/components/OnboardingChat";
import HistoryPanel, { DayRecord } from "@/components/HistoryPanel";
import { dayTemplates, type Lead } from "@/lib/dummyLeads";

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

  const pastDays: DayRecord[] = useMemo(
    () =>
      days.slice(0, -1).map((day) => ({
        id: day.id,
        label: `Day ${day.id}`,
        dateLabel: day.dateLabel,
        standup: day.standup,
        leads: day.leads,
        statuses: day.statuses,
        feedback: day.feedback,
      })),
    [days],
  );

  const resetDemo = () => {
    setScreen("welcome");
    setProfile(null);
    setDays([]);
    setEditingLeadId(null);
    setFeedbackLeadId(null);
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

  const handleSimulateNextDay = () => {
    if (!currentDay) return;
    const rejectedLeads = currentDay.leads.filter(
      (lead) => currentDay.statuses[lead.id] === "rejected",
    );
    const approvedNow = currentDay.leads.filter(
      (lead) => currentDay.statuses[lead.id] === "approved",
    ).length;
    const reasons = Array.from(
      new Set(
        rejectedLeads
          .map((lead) => currentDay.feedback[lead.id])
          .filter((reason): reason is string => Boolean(reason)),
      ),
    );

    let learned: string;
    if (rejectedLeads.length > 0) {
      learned = `Yesterday you rejected ${rejectedLeads.length} lead${
        rejectedLeads.length === 1 ? "" : "s"
      }${reasons.length ? ` (${reasons.join(", ")})` : ""}. I've adjusted today's picks to avoid similar profiles.`;
    } else if (approvedNow > 0) {
      learned =
        "Yesterday you approved everything I sent — I'll keep sourcing companies that match that profile.";
    } else {
      learned =
        "Still waiting on your feedback from yesterday's queue — I'll keep today's picks close to the same profile.";
    }

    const nextDayNumber = days.length + 1;
    const template = dayTemplates[(nextDayNumber - 1) % dayTemplates.length];
    const newDay: Day = {
      id: nextDayNumber,
      dateLabel: formatDateLabel(days.length),
      leads: template.leads,
      statuses: initStatuses(template.leads),
      drafts: initDrafts(template.leads),
      feedback: {},
      standup: `Good morning${profile?.name ? `, ${profile.name}` : ""}. I found ${template.leads.length} new leads today, building on what you taught me.`,
      learned,
      researched: template.researched,
    };

    setDays((current) => [...current, newDay]);
    setEditingLeadId(null);
    setFeedbackLeadId(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-900 text-sm font-semibold text-white">
              W
            </div>
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              Workforce
            </p>
          </div>
          {screen !== "welcome" && (
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-md border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Back to demo
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {screen === "welcome" && (
          <main className="space-y-20">
            {/* Hero section */}
            <section className="border-b border-gray-200 pb-16 pt-8">
              <div className="mx-auto max-w-2xl space-y-6 text-center">
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                  New era of work
                </p>
                <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
                  Hire AI employees that work every morning.
                </h1>
                <p className="mx-auto max-w-lg text-lg leading-7 text-gray-500">
                  Your first employee sources leads, drafts outreach, and waits
                  for your approval.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setScreen("role")}
                    className="rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
                  >
                    Hire your first employee
                  </button>
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
                  <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                    {feature.label}
                  </p>
                  <p className="mt-3 text-base font-medium text-gray-900">
                    {feature.desc}
                  </p>
                </article>
              ))}
            </section>
          </main>
        )}

        {screen === "role" && (
          <main className="space-y-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                Step 1
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                Choose a role to hire
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
                Every employee comes with a clear job description and a
                dashboard where you review their work.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setScreen("onboarding")}
                className="rounded-lg border border-gray-900 bg-gray-900 p-6 text-left text-white transition hover:bg-gray-700"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-300">
                  Available now
                </p>
                <p className="mt-3 text-lg font-semibold">Lead Sourcer</p>
                <p className="mt-1.5 text-sm leading-6 text-gray-300">
                  Researches prospects and drafts personalized outreach
                  emails for your approval.
                </p>
              </button>

              {["Sales Ops Analyst", "Customer Success Rep"].map((role) => (
                <div
                  key={role}
                  className="cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 p-6 text-left opacity-60"
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    Coming soon
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-700">
                    {role}
                  </p>
                </div>
              ))}
            </div>
          </main>
        )}

        {screen === "onboarding" && (
          <main className="space-y-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                Step 2
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                Onboard Emma
              </h2>
            </div>

            {searchState === "loading" && (
              <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                Searching Apollo for leads that match your ICP…
              </div>
            )}

            {searchState === "error" && (
              <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {searchErrorMessage ?? "Lead search failed."}
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <OnboardingChat onComplete={handleOnboardingComplete} />

              <section className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                  Emma&apos;s profile
                </p>
                <div className="mt-4 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white">
                      E
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        Emma
                      </p>
                      <p className="text-sm text-gray-500">
                        Lead Sourcer & Outreach Specialist
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-gray-600">
                    Researches prospects, identifies fast-fit opportunities,
                    and personalizes outreach emails. Learns from your
                    feedback daily.
                  </p>

                  <div className="space-y-2 border-t border-gray-200 pt-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                      Key abilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Research",
                        "Analysis",
                        "Personalization",
                        "Learning",
                      ].map((ability) => (
                        <span
                          key={ability}
                          className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                        >
                          {ability}
                        </span>
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
              </section>
            </div>
          </main>
        )}

        {screen === "dashboard" && currentDay && (
          <main className="space-y-10">
            {/* Employee status card */}
            <section className="rounded-lg border border-gray-200 p-6">
              <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-lg font-medium text-white">
                    E
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                      Active employee · Day {currentDay.id} ·{" "}
                      {currentDay.dateLabel}
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                      Emma is working
                    </h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
                    {pendingCount > 0
                      ? "Waiting for approval"
                      : "All caught up"}
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateNextDay}
                    className="rounded-md border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                  >
                    Simulate next day →
                  </button>
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
                    <p className="text-xs font-medium text-gray-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-mono text-xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Standup section */}
            <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-lg border border-gray-200 p-6">
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                  Daily standup
                </p>
                <blockquote className="mt-4 border-l-2 border-gray-900 pl-4">
                  <p className="text-lg leading-7 text-gray-900">
                    {currentDay.standup}
                  </p>
                </blockquote>
              </article>

              <article className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    What I learned
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {currentDay.learned}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    What I&apos;m avoiding
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {profile?.badLeadCriteria || defaultBadLeadCriteria}
                  </p>
                </div>
              </article>
            </section>

            {/* Approval queue */}
            <section className="space-y-6 rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                    Step 3
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                    Review & approve leads
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Approve all
                </button>
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
                  <p className="text-sm font-medium text-gray-900">
                    Approval progress
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {approvedCount} approved • {pendingCount} pending
                  </p>
                </div>
                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm">
                  Emma is learning from your feedback
                </div>
              </div>
            </section>

            {/* History & experience */}
            <section className="space-y-4 rounded-lg border border-gray-200 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                  Experience
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                  History
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  What Emma has reviewed and learned on previous days.
                </p>
              </div>
              <HistoryPanel days={pastDays} />
            </section>
          </main>
        )}
      </div>
    </div>
  );
}
