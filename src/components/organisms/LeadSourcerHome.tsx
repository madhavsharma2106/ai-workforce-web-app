"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RunFailedCard } from "./RunFailedCard";
import { RunInProgressCard } from "./RunInProgressCard";
import { RunNotStartedCard } from "./RunNotStartedCard";
import { RunReviewPanel } from "./RunReviewPanel";
import { SearchAgainModal } from "./SearchAgainModal";
import { TaskHistory } from "./TaskHistory";
import { useLatestRun } from "@/hooks/useLatestRun";
import { patchLead, revealLeadEmail } from "@/lib/api/leads";
import { triggerRun } from "@/lib/api/employees";
import type {
  AgentRun,
  AgentRunStep,
  Lead,
  PassedCandidate,
  TaskHistoryItem,
} from "@/lib/types";
import { Tabs } from "@/components/atoms";

const SEARCH_AGAIN_MESSAGE = "Run a new lead search.";

type Props = {
  employeeId: string;
  initialRun: AgentRun | null;
  initialLeads: Lead[];
  initialResearchedCount: number;
  initialSteps: AgentRunStep[];
  initialHistory: TaskHistoryItem[];
  initialPassedCandidates: PassedCandidate[];
  oliverHired: boolean;
};

export const LeadSourcerHome = ({
  employeeId,
  initialRun,
  initialLeads,
  initialResearchedCount,
  initialSteps,
  initialHistory,
  initialPassedCandidates,
  oliverHired,
}: Props) => {
  const {
    run,
    setRun,
    leads,
    setLeads,
    researchedCount,
    steps,
    passedCandidates,
    now,
  } = useLatestRun(employeeId, {
    run: initialRun,
    leads: initialLeads,
    researchedCount: initialResearchedCount,
    steps: initialSteps,
    passedCandidates: initialPassedCandidates,
  });
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const approvedCount = useMemo(
    () => leads.filter((lead) => lead.status === "approved").length,
    [leads],
  );
  const pendingCount = useMemo(
    () => leads.filter((lead) => lead.status === "pending").length,
    [leads],
  );

  const updateLead = (id: string, updater: (lead: Lead) => Lead) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? updater(lead) : lead)),
    );
  };

  const updateAndPatch = (
    id: string,
    updater: (lead: Lead) => Lead,
    body: Record<string, unknown>,
  ) => {
    updateLead(id, updater);
    void patchLead(id, body);
  };

  const handleRevealEmail = async (id: string) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || !lead.personId || lead.emailRevealed) return;

    setRevealingLeadId(id);
    try {
      const data = await revealLeadEmail(lead.personId, id);
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
    updateAndPatch(id, (current) => ({ ...current, status: "approved" }), {
      status: "approved",
    });
    if (feedbackLeadId === id) setFeedbackLeadId(null);
    void handleRevealEmail(id);
  };

  const handleReject = (id: string) => {
    updateAndPatch(id, (current) => ({ ...current, status: "rejected" }), {
      status: "rejected",
    });
    setFeedbackLeadId(id);
  };

  const handleApproveAll = () => {
    if (!oliverHired) return;
    leads
      .filter((lead) => lead.status === "pending")
      .forEach((lead) => handleApprove(lead.id));
    setFeedbackLeadId(null);
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    const id = feedbackLeadId;
    updateAndPatch(id, (current) => ({ ...current, feedbackReason: reason }), {
      feedbackReason: reason,
    });
    setFeedbackLeadId(null);
  };

  const handleSearchAgainSubmit = (customMessage: string | null) => {
    setSearchModalOpen(false);
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
    void triggerRun(employeeId, customMessage?.trim() || SEARCH_AGAIN_MESSAGE);
  };

  const handleOpenSearchModal = () => setSearchModalOpen(true);

  const renderCurrentTask = () => {
    if (!run) {
      return <RunNotStartedCard onSearchAgain={handleOpenSearchModal} />;
    }

    switch (run.status) {
      case "queued":
      case "running":
        return (
          <RunInProgressCard
            run={run}
            now={now}
            onSearchAgain={handleOpenSearchModal}
          />
        );
      case "failed":
        return (
          <RunFailedCard run={run} onSearchAgain={handleOpenSearchModal} />
        );
      case "waiting_approval":
      case "completed":
        return (
          <RunReviewPanel
            employeeId={employeeId}
            run={run}
            leads={leads}
            steps={steps}
            researchedCount={researchedCount}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            oliverHired={oliverHired}
            feedbackLeadId={feedbackLeadId}
            revealingLeadId={revealingLeadId}
            passedCandidates={passedCandidates}
            onSearchAgain={handleOpenSearchModal}
            onApproveAll={handleApproveAll}
            onApprove={handleApprove}
            onReject={handleReject}
            onRevealEmail={handleRevealEmail}
            onFeedbackSubmit={handleFeedbackSubmit}
          />
        );
      default: {
        const _exhaustive: never = run.status;
        return _exhaustive;
      }
    }
  };

  return (
    <main className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <Tabs
          tabs={[
            { key: "current", label: "Current task" },
            { key: "previous", label: "Previous tasks" },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
        <Link
          href={`/employee/${employeeId}/instructions`}
          className="rounded-md border border-(--border) px-3.5 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Instructions
        </Link>
      </div>
      {activeTab === "current" && renderCurrentTask()}
      {activeTab === "previous" && (
        <TaskHistory employeeId={employeeId} history={initialHistory} />
      )}
      <SearchAgainModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSubmit={handleSearchAgainSubmit}
      />
    </main>
  );
};
