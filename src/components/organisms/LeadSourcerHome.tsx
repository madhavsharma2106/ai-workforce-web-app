"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LeadCard from "@/components/organisms/LeadCard";
import type { AgentRun, Lead } from "@/lib/types";
import { Badge, Button, Card, EmployeeAvatar, Eyebrow, Heading, Text } from "@/components/atoms";
import { ROLE_TITLES } from "@/lib/employees";

const POLL_INTERVAL_MS = 3000;
const STUCK_THRESHOLD_MS = 90_000;
const SEARCH_AGAIN_MESSAGE = "Run today's lead search.";

type Props = {
  employeeId: string;
  initialRun: AgentRun | null;
  initialLeads: Lead[];
  initialResearchedCount: number;
};

const isInProgress = (run: AgentRun | null) =>
  run === null || run.status === "queued" || run.status === "running";

const LeadSourcerHome = ({
  employeeId,
  initialRun,
  initialLeads,
  initialResearchedCount,
}: Props) => {
  const [run, setRun] = useState<AgentRun | null>(initialRun);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [researchedCount, setResearchedCount] = useState(initialResearchedCount);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const draftsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isInProgress(run)) return;

    const interval = setInterval(async () => {
      setNow(Date.now());
      const response = await fetch(`/api/employees/${employeeId}/latest-run`);
      if (!response.ok) return;
      const data = await response.json();
      setRun(data.run);
      setLeads(data.leads);
      setResearchedCount(data.researchedCount);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [employeeId, run]);

  const approvedCount = useMemo(
    () => leads.filter((lead) => lead.status === "approved").length,
    [leads],
  );
  const pendingCount = useMemo(
    () => leads.filter((lead) => lead.status === "pending").length,
    [leads],
  );

  const patchLead = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const updateLead = (id: string, updater: (lead: Lead) => Lead) => {
    setLeads((current) => current.map((lead) => (lead.id === id ? updater(lead) : lead)));
  };

  const handleRevealEmail = async (id: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || !lead.personId || lead.emailRevealed) return;

    setRevealingLeadId(id);
    try {
      const response = await fetch("/api/leads/reveal-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: lead.personId, leadId: id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to reveal email.");
      updateLead(id, (current) => ({
        ...current,
        email: data.email ?? current.email,
        emailRevealed: true,
      }));
    } catch {
      // Reveal is a secondary action — leave the lead locked and let the
      // user retry rather than surfacing a blocking error.
    } finally {
      setRevealingLeadId(null);
    }
  };

  const handleApprove = (id: string) => {
    updateLead(id, (current) => ({ ...current, status: "approved" }));
    void patchLead(id, { status: "approved" });
    if (feedbackLeadId === id) setFeedbackLeadId(null);
    void handleRevealEmail(id);
  };

  const handleReject = (id: string) => {
    updateLead(id, (current) => ({ ...current, status: "rejected" }));
    void patchLead(id, { status: "rejected" });
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleApproveAll = () => {
    leads.filter((lead) => lead.status === "pending").forEach((lead) => handleApprove(lead.id));
    setFeedbackLeadId(null);
  };

  const handleDraftChange = (id: string, value: string) => {
    draftsRef.current[id] = value;
    updateLead(id, (current) => ({ ...current, draft: value }));
  };

  const handleToggleEdit = (id: string) => {
    const wasEditing = editingLeadId === id;
    setEditingLeadId(wasEditing ? null : id);
    if (wasEditing && draftsRef.current[id] !== undefined) {
      void patchLead(id, { draft: draftsRef.current[id] });
    }
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    const id = feedbackLeadId;
    updateLead(id, (current) => ({ ...current, feedbackReason: reason }));
    void patchLead(id, { feedbackReason: reason });
    setFeedbackLeadId(null);
  };

  const handleSearchAgain = () => {
    setRun({
      id: "",
      user_id: "",
      employee_id: employeeId,
      trigger: "manual",
      status: "queued",
      summary: null,
      job_id: null,
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
    });
    void fetch(`/api/employees/${employeeId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: SEARCH_AGAIN_MESSAGE }),
    });
  };

  if (run === null || run.status === "queued" || run.status === "running") {
    const stuck =
      run !== null && now !== null && now - new Date(run.created_at).getTime() > STUCK_THRESHOLD_MS;
    return (
      <Card as="section" padding="lg">
        <Eyebrow>Emma</Eyebrow>
        <Heading as="h2" size="md" className="mt-1">
          Researching today&apos;s leads…
        </Heading>
        <Text size="sm" tone="muted" className="mt-2">
          Emma is searching for companies that match your profile and drafting
          outreach — this can take a minute.
        </Text>
        {stuck && (
          <div className="mt-4 space-y-2">
            <Text size="sm" tone="muted">
              This is taking longer than expected.
            </Text>
            <Button variant="secondary" onClick={handleSearchAgain}>
              Search again
            </Button>
          </div>
        )}
      </Card>
    );
  }

  const dateLabel = run.created_at
    ? new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <main className="space-y-10">
      <Card as="section" padding="lg">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <EmployeeAvatar seed={employeeId} size="lg" />
            <div>
              <Eyebrow>
                {ROLE_TITLES.lead_sourcer} · {dateLabel}
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
            <Button variant="secondary" size="sm" onClick={handleSearchAgain}>
              Search again
            </Button>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 sm:grid-cols-3">
          {[
            { label: "Researched", value: `${researchedCount} companies` },
            { label: "Qualified", value: `${leads.length} leads` },
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

      {run.summary && (
        <Card as="article" padding="lg">
          <Eyebrow>Daily standup</Eyebrow>
          <blockquote className="mt-4 border-l-2 border-gray-900 pl-4">
            <Text size="lg">{run.summary}</Text>
          </blockquote>
        </Card>
      )}

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
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              status={lead.status}
              draftText={lead.draft}
              isEditing={editingLeadId === lead.id}
              feedbackActive={feedbackLeadId === lead.id}
              feedbackReason={lead.feedbackReason}
              onApprove={() => handleApprove(lead.id)}
              onReject={() => handleReject(lead.id)}
              onRevealEmail={() => handleRevealEmail(lead.id)}
              isRevealingEmail={revealingLeadId === lead.id}
              onToggleEdit={() => handleToggleEdit(lead.id)}
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
