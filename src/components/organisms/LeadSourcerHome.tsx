"use client";

import { useEffect, useMemo, useState } from "react";
import LeadCard from "@/components/organisms/LeadCard";
import type { Day } from "@/lib/types";
import { Badge, Button, Card, EmployeeAvatar, Eyebrow, Heading, Text } from "@/components/atoms";

const defaultBadLeadCriteria =
  "companies that already have strong video case studies, agencies, or consumer brands";

type Props = {
  employeeId: string;
};

const LeadSourcerHome = ({ employeeId }: Props) => {
  const [day, setDay] = useState<Day | null | undefined>(undefined);
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<number | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`day:${employeeId}`);
    // sessionStorage is a browser-only API, so this can't be read during
    // SSR/render — an effect is the only place this initial sync can happen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDay(stored ? (JSON.parse(stored) as Day) : null);
  }, [employeeId]);

  const approvedCount = useMemo(
    () =>
      day ? Object.values(day.statuses).filter((s) => s === "approved").length : 0,
    [day],
  );
  const pendingCount = useMemo(
    () =>
      day ? Object.values(day.statuses).filter((s) => s === "pending").length : 0,
    [day],
  );

  const updateDay = (updater: (day: Day) => Day) => {
    setDay((current) => (current ? updater(current) : current));
  };

  const handleRevealEmail = async (id: number) => {
    const lead = day?.leads.find((l) => l.id === id);
    if (!lead || !lead.personId || lead.emailRevealed) return;

    setRevealingLeadId(id);
    try {
      const response = await fetch("/api/leads/reveal-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: lead.personId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to reveal email.");
      updateDay((current) => ({
        ...current,
        leads: current.leads.map((l) =>
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
    updateDay((current) => ({
      ...current,
      statuses: { ...current.statuses, [id]: "approved" },
    }));
    if (feedbackLeadId === id) setFeedbackLeadId(null);
    void handleRevealEmail(id);
  };

  const handleReject = (id: number) => {
    updateDay((current) => ({
      ...current,
      statuses: { ...current.statuses, [id]: "rejected" },
    }));
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleApproveAll = () => {
    updateDay((current) => {
      const nextStatuses = { ...current.statuses };
      current.leads.forEach((lead) => {
        if (nextStatuses[lead.id] === "pending") nextStatuses[lead.id] = "approved";
      });
      return { ...current, statuses: nextStatuses };
    });
    setFeedbackLeadId(null);
  };

  const handleDraftChange = (id: number, value: string) => {
    updateDay((current) => ({
      ...current,
      drafts: { ...current.drafts, [id]: value },
    }));
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    updateDay((current) => ({
      ...current,
      feedback: { ...current.feedback, [feedbackLeadId]: reason },
    }));
    setFeedbackLeadId(null);
  };

  if (day === undefined) {
    return null;
  }

  if (day === null) {
    return (
      <Card as="section" padding="lg">
        <Eyebrow>Emma</Eyebrow>
        <Heading as="h2" size="md" className="mt-1">
          No run to show yet
        </Heading>
        <Text size="sm" tone="muted" className="mt-2">
          This preview build doesn&apos;t persist Emma&apos;s work across page
          reloads — head back to her onboarding to kick off a fresh run.
        </Text>
      </Card>
    );
  }

  return (
    <main className="space-y-10">
      <Card as="section" padding="lg">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <EmployeeAvatar seed={employeeId} size="lg" />
            <div>
              <Eyebrow>
                Active employee · Day {day.id} · {day.dateLabel}
              </Eyebrow>
              <Heading as="h2" size="md" className="mt-1">
                Emma is working
              </Heading>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="accent" size="md">
              {pendingCount > 0 ? "Waiting for approval" : "All caught up"}
            </Badge>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Researched", value: `${day.researched} companies` },
            { label: "Qualified", value: `${day.leads.length} leads` },
            { label: "Drafted", value: `${day.leads.length} emails` },
            { label: "In queue", value: `${pendingCount} for review` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-5">
              <Text size="xs" tone="muted" weight="medium">
                {stat.label}
              </Text>
              <Text size="xl" weight="semibold" className="mt-2 font-mono">
                {stat.value}
              </Text>
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card as="article" padding="lg">
          <Eyebrow>Daily standup</Eyebrow>
          <blockquote className="mt-4 border-l-2 border-gray-900 pl-4">
            <Text size="lg">{day.standup}</Text>
          </blockquote>
        </Card>

        <article className="space-y-3">
          <Card padding="sm">
            <Eyebrow tone="muted">What I learned</Eyebrow>
            <Text size="sm" tone="subtle" className="mt-2">
              {day.learned}
            </Text>
          </Card>
          <Card padding="sm">
            <Eyebrow tone="muted">What I&apos;m avoiding</Eyebrow>
            <Text size="sm" tone="subtle" className="mt-2">
              {defaultBadLeadCriteria}
            </Text>
          </Card>
        </article>
      </section>

      <Card as="section" padding="lg" className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Eyebrow>Review</Eyebrow>
            <Heading as="h3" size="md" className="mt-1">
              Review & approve leads
            </Heading>
          </div>
          <Button className="px-4!" onClick={handleApproveAll}>
            Approve all
          </Button>
        </div>

        <div className="grid gap-4">
          {day.leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              status={day.statuses[lead.id]}
              draftText={day.drafts[lead.id]}
              isEditing={editingLeadId === lead.id}
              feedbackActive={feedbackLeadId === lead.id}
              feedbackReason={day.feedback[lead.id]}
              onApprove={() => handleApprove(lead.id)}
              onReject={() => handleReject(lead.id)}
              onRevealEmail={() => handleRevealEmail(lead.id)}
              isRevealingEmail={revealingLeadId === lead.id}
              onToggleEdit={() =>
                setEditingLeadId((current) => (current === lead.id ? null : lead.id))
              }
              onDraftChange={(value) => handleDraftChange(lead.id, value)}
              onFeedbackSubmit={handleFeedbackSubmit}
            />
          ))}
        </div>

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
  );
};

export default LeadSourcerHome;
