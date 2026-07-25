"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LeadCard } from "./LeadCard";
import { ActivityCard } from "./ActivityCard";
import { TaskHistory } from "./TaskHistory";
import {
  patchLead,
  retryDraft,
  retrySend,
  revealLeadEmail,
  saveDraftToMailbox,
} from "@/lib/api/leads";
import { getDrafts } from "@/lib/api/employees";
import type { AgentRun, AgentRunStep, Lead } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmployeeAvatar,
  Eyebrow,
  Heading,
  Tabs,
  Text,
} from "@/components/atoms";
import { Alert } from "@/components/molecules";
import { ROLE_TITLES } from "@/lib/employees";

const POLL_INTERVAL_MS = 3000;

const FEEDBACK_OPTIONS = [
  "Wrong tone",
  "Too long",
  "Missing personalization",
  "Other",
];

type Props = {
  employeeId: string;
  initialLeads: Lead[];
  mailboxConnected: boolean;
  initialSteps: AgentRunStep[];
  history: AgentRun[];
};

export const SalesRepresentativeHome = ({
  employeeId,
  initialLeads,
  mailboxConnected,
  initialSteps,
  history,
}: Props) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [steps, setSteps] = useState<AgentRunStep[]>(initialSteps);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "previous">("current");

  const isDrafting = useMemo(
    () => leads.some((lead) => lead.draft === "" && !lead.draftFailed),
    [leads],
  );
  const isSending = useMemo(
    () => leads.some((lead) => lead.sendStatus === "sending"),
    [leads],
  );
  const isSavingDraft = useMemo(
    () => leads.some((lead) => lead.draftSaveStatus === "saving"),
    [leads],
  );
  const isSendingReply = useMemo(
    () => leads.some((lead) => lead.replySendStatus === "sending"),
    [leads],
  );

  useEffect(() => {
    if (!isDrafting && !isSending && !isSavingDraft && !isSendingReply) return;

    const interval = setInterval(async () => {
      try {
        const data = await getDrafts(employeeId);
        if (!data) return;
        setLeads(data.leads);
        setSteps(data.steps);
      } catch (error) {
        console.error("Failed to poll drafts", error);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [employeeId, isDrafting, isSending, isSavingDraft, isSendingReply]);

  const updateLead = (id: string, updater: (lead: Lead) => Lead) => {
    setLeads((current) =>
      current.map((lead) => (lead.id === id ? updater(lead) : lead)),
    );
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
      // Secondary action — leave locked and let the user retry.
    } finally {
      setRevealingLeadId(null);
    }
  };

  const handleApprove = (id: string) => {
    updateLead(id, (current) => ({
      ...current,
      draftStatus: "approved",
      sendStatus: "sending",
    }));
    void patchLead(id, { draftStatus: "approved" });
    if (feedbackLeadId === id) setFeedbackLeadId(null);
  };

  const handleReject = (id: string) => {
    updateLead(id, (current) => ({ ...current, draftStatus: "rejected" }));
    void patchLead(id, { draftStatus: "rejected" });
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleApproveReply = (id: string) => {
    updateLead(id, (current) => ({
      ...current,
      replyStatus: "approved",
      replySendStatus: "sending",
    }));
    void patchLead(id, { replyStatus: "approved" });
  };

  const handleRejectReply = (id: string) => {
    updateLead(id, (current) => ({ ...current, replyStatus: "rejected" }));
    void patchLead(id, { replyStatus: "rejected" });
  };

  const handleToggleEdit = (id: string) => {
    setEditingLeadId((current) => (current === id ? null : id));
  };

  const handleSubjectChange = (id: string, value: string) => {
    updateLead(id, (current) => ({ ...current, subject: value }));
    void patchLead(id, { subject: value });
  };

  const handleDraftChange = (id: string, value: string) => {
    updateLead(id, (current) => ({ ...current, draft: value }));
    void patchLead(id, { draft: value });
  };

  const handleFeedbackSubmit = (reason: string) => {
    if (feedbackLeadId === null) return;
    const id = feedbackLeadId;
    updateLead(id, (current) => ({ ...current, feedbackReason: reason }));
    void patchLead(id, { feedbackReason: reason });
    setFeedbackLeadId(null);
  };

  const handleRetryDraft = (id: string) => {
    updateLead(id, (current) => ({
      ...current,
      draftFailed: false,
      draftError: undefined,
    }));
    void retryDraft(id).catch((error) =>
      console.error("Failed to retry draft", error),
    );
  };

  const handleRetrySend = (id: string) => {
    updateLead(id, (current) => ({
      ...current,
      sendStatus: "sending",
      sendError: undefined,
    }));
    void retrySend(id).catch((error) =>
      console.error("Failed to retry send", error),
    );
  };

  const handleSaveDraft = (id: string) => {
    updateLead(id, (current) => ({
      ...current,
      draftSaveStatus: "saving",
      draftSaveError: undefined,
    }));
    void saveDraftToMailbox(id).catch((error) =>
      console.error("Failed to save draft to mailbox", error),
    );
  };

  const drafting = leads.filter(
    (lead) => lead.draft === "" && !lead.draftFailed,
  );
  const draftFailed = leads.filter(
    (lead) => lead.draft === "" && lead.draftFailed,
  );
  const awaitingApproval = leads.filter(
    (lead) => lead.draft !== "" && lead.draftStatus === "pending",
  );
  const sending = leads.filter(
    (lead) =>
      lead.draftStatus === "approved" &&
      (lead.sendStatus === "not_sent" || lead.sendStatus === "sending"),
  );
  const sendFailed = leads.filter(
    (lead) => lead.draftStatus === "approved" && lead.sendStatus === "failed",
  );
  const sent = leads.filter(
    (lead) => lead.draftStatus === "approved" && lead.sendStatus === "sent",
  );
  const rejected = leads.filter((lead) => lead.draftStatus === "rejected");
  const replied = leads.filter((lead) => Boolean(lead.lastReplySnippet));

  const sections: { title: string; items: Lead[] }[] = [
    { title: "Awaiting your approval", items: awaitingApproval },
    { title: "Rejected", items: rejected },
  ];

  const headline = (() => {
    if (drafting.length > 0) {
      return `I'm drafting outreach for ${drafting.length} ${drafting.length === 1 ? "company" : "companies"}…`;
    }
    if (sending.length > 0) {
      return `I'm sending ${sending.length} ${sending.length === 1 ? "email" : "emails"}…`;
    }
    if (awaitingApproval.length > 0) {
      return `I've got ${awaitingApproval.length} ${awaitingApproval.length === 1 ? "draft" : "drafts"} ready for your review`;
    }
    if (draftFailed.length > 0 || sendFailed.length > 0) {
      const failedCount = draftFailed.length + sendFailed.length;
      return `I ran into a problem with ${failedCount} ${failedCount === 1 ? "draft" : "drafts"}`;
    }
    return "I'm all caught up";
  })();

  const stats = [
    {
      label: "Drafted",
      value: `${leads.filter((lead) => lead.draft !== "").length} emails`,
    },
    { label: "Sent", value: `${sent.length} sent` },
    { label: "Replied", value: `${replied.length} replies` },
  ];

  const leadsTabContent = (
    <>
      <div className="flex items-center gap-4">
        <EmployeeAvatar seed={employeeId} size="lg" />
        <div>
          <Eyebrow>{ROLE_TITLES.sales_representative}</Eyebrow>
          <Heading as="h2" size="xl" italic className="mt-1">
            {headline}
          </Heading>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md">
            <Eyebrow>{stat.label}</Eyebrow>
            <Heading as="p" size="md" className="mt-1.5">
              {stat.value}
            </Heading>
          </Card>
        ))}
      </div>

      {(drafting.length > 0 || sending.length > 0) && (
        <ActivityCard
          steps={steps}
          eyebrow="Live activity"
          title="What I'm doing"
          defaultExpanded
        />
      )}

      {!mailboxConnected && (
        <Alert
          variant="error"
          className="flex items-center justify-between gap-4"
        >
          <Text size="sm">
            Connect your mailbox in Settings before I can send.
          </Text>
          <Link
            href="/settings"
            className="shrink-0 text-sm font-medium underline decoration-dotted underline-offset-2"
          >
            Go to Settings
          </Link>
        </Alert>
      )}

      {drafting.length > 0 && (
        <Card as="section" padding="lg">
          <div className="flex items-center justify-between">
            <Eyebrow>Drafting</Eyebrow>
            <Badge tone="accent" size="md">
              {drafting.length} in progress
            </Badge>
          </div>
          <Text size="sm" tone="muted" className="mt-2">
            {drafting.map((lead) => lead.company).join(", ")}
          </Text>
        </Card>
      )}

      {draftFailed.length > 0 && (
        <Card as="section" padding="lg" className="space-y-4">
          <Eyebrow>Draft failed</Eyebrow>
          <div className="space-y-3">
            {draftFailed.map((lead) => (
              <Alert
                key={lead.id}
                variant="error"
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <Text size="sm" weight="medium">
                    {lead.company}
                  </Text>
                  <Text size="sm" tone="muted" className="mt-0.5">
                    {lead.draftError}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRetryDraft(lead.id)}
                >
                  Try again
                </Button>
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {sending.length > 0 && (
        <Card as="section" padding="lg">
          <div className="flex items-center justify-between">
            <Eyebrow>Sending</Eyebrow>
            <Badge tone="accent" size="md">
              {sending.length} in progress
            </Badge>
          </div>
          <Text size="sm" tone="muted" className="mt-2">
            {sending.map((lead) => lead.company).join(", ")}
          </Text>
        </Card>
      )}

      {sendFailed.length > 0 && (
        <Card as="section" padding="lg" className="space-y-4">
          <Eyebrow>Couldn&apos;t send</Eyebrow>
          <div className="space-y-3">
            {sendFailed.map((lead) => (
              <Alert
                key={lead.id}
                variant="error"
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <Text size="sm" weight="medium">
                    {lead.company}
                  </Text>
                  <Text size="sm" tone="muted" className="mt-0.5">
                    {lead.sendError}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRetrySend(lead.id)}
                >
                  Try again
                </Button>
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {sent.length > 0 && (
        <Card as="section" padding="lg" className="space-y-4">
          <Eyebrow>Sent</Eyebrow>
          <div className="space-y-3">
            {sent.map((lead) =>
              lead.replyStatus ? (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  status="approved"
                  showDraft={false}
                  approvedMessage="Sent."
                  feedbackActive={false}
                  onApprove={() => {}}
                  onReject={() => {}}
                  onFeedbackSubmit={() => {}}
                  onRevealEmail={() => {}}
                  isRevealingEmail={false}
                  replyStatus={lead.replyStatus}
                  replySnippet={lead.lastReplySnippet}
                  replyDraftText={lead.replyDraft}
                  onApproveReply={() => handleApproveReply(lead.id)}
                  onRejectReply={() => handleRejectReply(lead.id)}
                  approveReplyDisabled={!mailboxConnected}
                />
              ) : (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2.5"
                >
                  <Text size="sm" weight="medium">
                    {lead.company}
                  </Text>
                  <Badge tone="accent" size="sm">
                    Sent
                  </Badge>
                </div>
              ),
            )}
          </div>
        </Card>
      )}

      {leads.length === 0 && (
        <Card as="section" padding="lg">
          <Text size="sm" tone="muted">
            I don&apos;t have any leads waiting on outreach yet — approve one on
            Emma&apos;s page and I&apos;ll get started.
          </Text>
        </Card>
      )}

      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <Card
              key={section.title}
              as="section"
              padding="lg"
              className="space-y-4"
            >
              <Heading as="h3" size="md">
                {section.title}
              </Heading>
              <div className="grid gap-4">
                {section.items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    status={lead.draftStatus}
                    showDraft
                    subjectText={lead.subject}
                    draftText={lead.draft}
                    isEditing={editingLeadId === lead.id}
                    feedbackActive={feedbackLeadId === lead.id}
                    feedbackReason={lead.feedbackReason}
                    feedbackOptions={FEEDBACK_OPTIONS}
                    approveLabel="Send as you"
                    approveDisabled={!mailboxConnected}
                    onApprove={() => handleApprove(lead.id)}
                    onReject={() => handleReject(lead.id)}
                    onToggleEdit={() => handleToggleEdit(lead.id)}
                    onSubjectChange={(value) =>
                      handleSubjectChange(lead.id, value)
                    }
                    onDraftChange={(value) => handleDraftChange(lead.id, value)}
                    onFeedbackSubmit={handleFeedbackSubmit}
                    onRevealEmail={() => handleRevealEmail(lead.id)}
                    isRevealingEmail={revealingLeadId === lead.id}
                    onSaveDraft={() => handleSaveDraft(lead.id)}
                    saveDraftDisabled={!mailboxConnected}
                    draftSaveStatus={lead.draftSaveStatus}
                    draftSaveError={lead.draftSaveError}
                  />
                ))}
              </div>
            </Card>
          ),
      )}
    </>
  );

  return (
    <main className="mx-auto max-w-190 space-y-9">
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
          className="rounded-full bg-(--secondary-bg) px-4 py-1.5 text-[13px] font-bold text-(--muted-faint-3) transition hover:bg-(--secondary-hover)"
        >
          Instructions
        </Link>
      </div>
      {activeTab === "current" && (
        <div className="space-y-10">{leadsTabContent}</div>
      )}
      {activeTab === "previous" && (
        <TaskHistory employeeId={employeeId} history={history} />
      )}
    </main>
  );
};
