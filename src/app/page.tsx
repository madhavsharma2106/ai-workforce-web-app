"use client";

import { useMemo, useState } from "react";
import LeadCard, { Lead } from "@/components/LeadCard";

const defaultLeads: Lead[] = [
  {
    id: 1,
    company: "Waveflow Media",
    website: "waveflow.media",
    fit: "Video-first SaaS with weak case study storytelling.",
    decisionMaker: "Maya Patel, Head of Growth",
    email: "maya@waveflow.media",
    draft:
      "Hi Maya, I noticed Waveflow has strong product video energy but few customer stories. I'd love to share how a fresh case study series could help you win more video-first buyers.",
    sources: "LinkedIn, company page, product landing page",
  },
  {
    id: 2,
    company: "BrightCove Labs",
    website: "brightcovelabs.com",
    fit: "SaaS team with launch videos but no follow-up campaigns.",
    decisionMaker: "Jordan Lee, Marketing Director",
    email: "jordan@brightcovelabs.com",
    draft:
      "Hi Jordan, I saw your recent launch content and think a personalized case study series could extend that momentum to enterprise buyers.",
    sources: "Crunchbase, newsletter, public case studies",
  },
  {
    id: 3,
    company: "FlowPath AI",
    website: "flowpath.ai",
    fit: "AI product with limited customer storytelling online.",
    decisionMaker: "Avery Chen, Founder",
    email: "avery@flowpath.ai",
    draft:
      "Hi Avery, FlowPath AI has a strong product story. I'd suggest a set of short client videos that highlight real ROI and make outreach feel more human.",
    sources: "Twitter, product page, investor notes",
  },
  {
    id: 4,
    company: "PulseCraft",
    website: "pulsecraft.co",
    fit: "Growth-stage SaaS without a clear video case study path.",
    decisionMaker: "Noah Rivera, VP Sales",
    email: "noah@pulsecraft.co",
    draft:
      "Hi Noah, PulseCraft's audience could really benefit from a video-led case study campaign that turns product proof into pipeline warm leads.",
    sources: "LinkedIn, pricing page, press release",
  },
  {
    id: 5,
    company: "StudioScale",
    website: "studioscale.io",
    fit: "Creative SaaS with product demos but no outreach personalization.",
    decisionMaker: "Sofia Nguyen, Chief Marketing Officer",
    email: "sofia@studioscale.io",
    draft:
      "Hi Sofia, I noticed StudioScale has a compelling demo library. I can help turn that into outreach that feels personal and high-touch.",
    sources: "Instagram, demo page, team bios",
  },
];

const defaultClientPrompt =
  "B2B SaaS companies with weak video presence that could benefit from case studies or product videos.";
const defaultBadLeads =
  "Companies that already have strong video case studies, agencies, or consumer brands.";

type ApprovalStatus = "pending" | "approved" | "rejected";

type LeadDrafts = Record<number, string>;

export default function Home() {
  const [screen, setScreen] = useState<"welcome" | "hire" | "dashboard">(
    "welcome",
  );
  const [clientDescription, setClientDescription] =
    useState(defaultClientPrompt);
  const [badLeadCriteria, setBadLeadCriteria] = useState(defaultBadLeads);
  const [leadStatuses, setLeadStatuses] = useState<
    Record<number, ApprovalStatus>
  >(
    defaultLeads.reduce(
      (acc, lead) => ({ ...acc, [lead.id]: "pending" as ApprovalStatus }),
      {},
    ),
  );
  const [drafts, setDrafts] = useState<LeadDrafts>(
    defaultLeads.reduce((acc, lead) => ({ ...acc, [lead.id]: lead.draft }), {}),
  );
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<number | null>(null);
  const [feedbackMemo, setFeedbackMemo] = useState<Record<number, string>>({});

  const approvedCount = useMemo(
    () =>
      Object.values(leadStatuses).filter((status) => status === "approved")
        .length,
    [leadStatuses],
  );

  const pendingCount = useMemo(
    () =>
      Object.values(leadStatuses).filter((status) => status === "pending")
        .length,
    [leadStatuses],
  );

  const handleApprove = (id: number) => {
    setLeadStatuses((current) => ({ ...current, [id]: "approved" }));
    if (feedbackLeadId === id) setFeedbackLeadId(null);
  };

  const handleReject = (id: number) => {
    setLeadStatuses((current) => ({ ...current, [id]: "rejected" }));
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleApproveAll = () => {
    setLeadStatuses((current) => {
      const next = { ...current };
      defaultLeads.forEach((lead) => {
        if (next[lead.id] === "pending") next[lead.id] = "approved";
      });
      return next;
    });
    setFeedbackLeadId(null);
  };

  const handleDraftChange = (id: number, value: string) => {
    setDrafts((current) => ({ ...current, [id]: value }));
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    setFeedbackMemo((current) => ({ ...current, [feedbackLeadId]: reason }));
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
              onClick={() => setScreen("welcome")}
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
                    onClick={() => setScreen("hire")}
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

        {screen === "hire" && (
          <main className="space-y-10">
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                    Step 1
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    Meet Emma
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">
                        Ideal client description
                      </span>
                      <textarea
                        value={clientDescription}
                        onChange={(event) =>
                          setClientDescription(event.target.value)
                        }
                        className="min-h-35 w-full rounded-md border border-gray-200 bg-white p-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">
                        Bad lead criteria
                      </span>
                      <textarea
                        value={badLeadCriteria}
                        onChange={(event) =>
                          setBadLeadCriteria(event.target.value)
                        }
                        className="min-h-35 w-full rounded-md border border-gray-200 bg-white p-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("dashboard")}
                  className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700 sm:w-auto"
                >
                  Hire Emma →
                </button>
              </section>

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

        {screen === "dashboard" && (
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
                      Active employee
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                      Emma is working
                    </h2>
                  </div>
                </div>
                <div className="rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
                  Waiting for approval
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Researched", value: "84 companies" },
                  { label: "Qualified", value: "30 leads" },
                  { label: "Drafted", value: "30 emails" },
                  { label: "In queue", value: "5 for review" },
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
                    Good morning. I found 30 qualified leads today and prepared
                    personalized emails for review.
                  </p>
                </blockquote>
              </article>

              <article className="space-y-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    What I learned
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Companies with weak customer video are most receptive when
                    outreach references case studies.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    Tomorrow&apos;s plan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    I&apos;ll avoid companies like: strong case study
                    libraries, consumer brands, or agencies.
                  </p>
                </div>
              </article>
            </section>

            {/* Approval queue */}
            <section className="space-y-6 rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
                    Step 2
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
                {defaultLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    status={leadStatuses[lead.id]}
                    draftText={drafts[lead.id]}
                    isEditing={editingLeadId === lead.id}
                    feedbackActive={feedbackLeadId === lead.id}
                    feedbackReason={feedbackMemo[lead.id]}
                    onApprove={() => handleApprove(lead.id)}
                    onReject={() => handleReject(lead.id)}
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
          </main>
        )}
      </div>
    </div>
  );
}
