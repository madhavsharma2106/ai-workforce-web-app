"use client";

import { useEffect, useMemo, useState } from "react";
import RunInProgressCard from "@/components/organisms/RunInProgressCard";
import RunReviewPanel from "@/components/organisms/RunReviewPanel";
import TaskHistory from "@/components/organisms/TaskHistory";
import type { AgentRun, Lead, TaskHistoryItem } from "@/lib/types";
import { Tabs } from "@/components/atoms";

const POLL_INTERVAL_MS = 3000;
const SEARCH_AGAIN_MESSAGE = "Run a new lead search.";

type Props = {
  employeeId: string;
  initialRun: AgentRun | null;
  initialLeads: Lead[];
  initialResearchedCount: number;
  initialHistory: TaskHistoryItem[];
  oliverHired: boolean;
};

const isInProgress = (run: AgentRun | null) =>
  run === null || run.status === "queued" || run.status === "running";

const LeadSourcerHome = ({
  employeeId,
  initialRun,
  initialLeads,
  initialResearchedCount,
  initialHistory,
  oliverHired,
}: Props) => {
  const [run, setRun] = useState<AgentRun | null>(initialRun);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [researchedCount, setResearchedCount] = useState(initialResearchedCount);
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");

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
    if (!oliverHired) return;
    updateLead(id, (current) => ({ ...current, status: "approved" }));
    void patchLead(id, { status: "approved" });
    if (feedbackLeadId === id) setFeedbackLeadId(null);
    void handleRevealEmail(id);
  };

  const handleReject = (id: string) => {
    updateLead(id, (current) => ({ ...current, status: "rejected" }));
    void patchLead(id, { status: "rejected" });
    setFeedbackLeadId(id);
  };

  const handleApproveAll = () => {
    if (!oliverHired) return;
    leads.filter((lead) => lead.status === "pending").forEach((lead) => handleApprove(lead.id));
    setFeedbackLeadId(null);
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

  const currentTaskContent =
    run === null || run.status === "queued" || run.status === "running" ? (
      <RunInProgressCard run={run} now={now} onSearchAgain={handleSearchAgain} />
    ) : (
      <RunReviewPanel
        employeeId={employeeId}
        run={run}
        leads={leads}
        researchedCount={researchedCount}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        oliverHired={oliverHired}
        feedbackLeadId={feedbackLeadId}
        revealingLeadId={revealingLeadId}
        onSearchAgain={handleSearchAgain}
        onApproveAll={handleApproveAll}
        onApprove={handleApprove}
        onReject={handleReject}
        onRevealEmail={handleRevealEmail}
        onFeedbackSubmit={handleFeedbackSubmit}
      />
    );

  return (
    <main className="space-y-10">
      <Tabs
        tabs={[
          { key: "current", label: "Current task" },
          { key: "previous", label: "Previous tasks" },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "current" ? (
        currentTaskContent
      ) : (
        <TaskHistory employeeId={employeeId} history={initialHistory} />
      )}
    </main>
  );
};

export default LeadSourcerHome;
