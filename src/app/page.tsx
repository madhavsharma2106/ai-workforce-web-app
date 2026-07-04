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
    <div className="min-h-screen bg-[#f5ede3] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#ea7317] text-xl font-semibold text-white">
              W
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea7317]">
                Workforce
              </p>
              <p className="text-sm font-semibold text-slate-900">
                AI Employees
              </p>
            </div>
          </div>
          {screen !== "welcome" && (
            <button
              type="button"
              onClick={() => setScreen("welcome")}
              className="rounded-full border border-amber-100 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
            >
              Back to demo
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        {screen === "welcome" && (
          <main className="space-y-16">
            {/* Hero section */}
            <section className="rounded-[32px] bg-gradient-to-br from-[#d45f0a] via-[#c9a052] to-[#d4a574] px-8 py-16 text-white shadow-sm sm:px-12 sm:py-24">
              <div className="mx-auto max-w-3xl space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-100">
                    New Era of Work
                  </p>
                  <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
                    Hire AI employees that work every morning.
                  </h1>
                </div>
                <p className="max-w-2xl text-lg leading-8 text-orange-50">
                  Your first employee sources leads, drafts outreach, and waits
                  for your approval.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setScreen("hire")}
                    className="rounded-full bg-[#ea7317] px-7 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#d45f0a]"
                  >
                    Hire your first employee
                  </button>
                </div>
              </div>
            </section>

            {/* Feature cards */}
            <section className="grid gap-6 md:grid-cols-3">
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
                <article
                  key={feature.label}
                  className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ea7317]">
                    {feature.label}
                  </p>
                  <p className="mt-4 font-serif text-lg font-semibold text-slate-900">
                    {feature.desc}
                  </p>
                </article>
              ))}
            </section>
          </main>
        )}

        {screen === "hire" && (
          <main className="space-y-12">
            {/* Accent band */}
            <div className="gradient-warm-band h-1 rounded-full" />

            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ea7317]">
                    Step 1
                  </p>
                  <h2 className="font-serif text-4xl font-bold text-slate-900">
                    Meet Emma
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block">
                      <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
                        Ideal client description
                      </span>
                      <textarea
                        value={clientDescription}
                        onChange={(event) =>
                          setClientDescription(event.target.value)
                        }
                        className="min-h-[140px] w-full rounded-3xl border border-amber-100 bg-[#f9f5ef] p-5 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block">
                      <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
                        Bad lead criteria
                      </span>
                      <textarea
                        value={badLeadCriteria}
                        onChange={(event) =>
                          setBadLeadCriteria(event.target.value)
                        }
                        className="min-h-[140px] w-full rounded-3xl border border-amber-100 bg-[#f9f5ef] p-5 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white"
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("dashboard")}
                  className="w-full rounded-full bg-[#ea7317] px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#d45f0a] sm:w-auto"
                >
                  Hire Emma →
                </button>
              </section>

              <section className="rounded-3xl border border-amber-100 bg-[#f9f5ef] p-8">
                <div className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ea7317]">
                      Emma's profile
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ea7317] to-[#c9a052] text-2xl font-bold text-white">
                          E
                        </div>
                        <div>
                          <p className="font-serif text-lg font-semibold text-slate-900">
                            Emma
                          </p>
                          <p className="text-sm font-semibold text-orange-700">
                            Lead Sourcer & Outreach Specialist
                          </p>
                        </div>
                      </div>

                      <p className="text-sm leading-6 text-slate-700">
                        Researches prospects, identifies fast-fit opportunities,
                        and personalizes outreach emails. Learns from your
                        feedback daily.
                      </p>

                      <div className="space-y-3 border-t border-amber-100 pt-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">
                            Key abilities
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[
                              "Research",
                              "Analysis",
                              "Personalization",
                              "Learning",
                            ].map((ability) => (
                              <span
                                key={ability}
                                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-100"
                              >
                                {ability}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-amber-100 pt-4 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">✓</span>
                          <span>Works 24/7 on your criteria</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">✓</span>
                          <span>Never sends without approval</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold">✓</span>
                          <span>Improves with every rejection</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </main>
        )}

        {screen === "dashboard" && (
          <main className="space-y-12">
            {/* Accent band */}
            <div className="gradient-warm-band h-1 rounded-full" />

            {/* Employee status card */}
            <section className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#ea7317] to-[#c9a052] text-4xl font-bold text-white">
                    E
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ea7317]">
                      Active Employee
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900">
                      Emma is working
                    </h2>
                  </div>
                </div>
                <div className="rounded-full bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 shadow-sm">
                  Waiting for approval
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Researched", value: "84 companies" },
                  { label: "Qualified", value: "30 leads" },
                  { label: "Drafted", value: "30 emails" },
                  { label: "In queue", value: "5 for review" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl bg-[#f9f5ef] p-6 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-serif text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Standup section */}
            <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ea7317]">
                  Daily Standup
                </p>
                <blockquote className="mt-6 border-l-4 border-[#ea7317] pl-6">
                  <p className="text-xl leading-8 text-slate-900">
                    Good morning. I found 30 qualified leads today and prepared
                    personalized emails for review.
                  </p>
                </blockquote>
              </article>

              <article className="space-y-4 rounded-3xl bg-[#f9f5ef] p-8">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ea7317]">
                    What I learned
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Companies with weak customer video are most receptive when
                    outreach references case studies.
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ea7317]">
                    Tomorrow's plan
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    I'll avoid companies like: strong case study libraries,
                    consumer brands, or agencies.
                  </p>
                </div>
              </article>
            </section>

            {/* Approval queue */}
            <section className="space-y-8 rounded-3xl border border-amber-100 bg-white p-8 shadow-sm">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ea7317]">
                    Step 2
                  </p>
                  <h3 className="mt-2 font-serif text-3xl font-bold text-slate-900">
                    Review & approve leads
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="rounded-full bg-[#ea7317] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#d45f0a]"
                >
                  Approve all
                </button>
              </div>

              <div className="grid gap-6">
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
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-orange-50 p-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Approval progress
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {approvedCount} approved • {pendingCount} pending
                  </p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-orange-700 shadow-sm">
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
