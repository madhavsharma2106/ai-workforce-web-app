"use client";

import { useEffect, useMemo, useState } from "react";
import LeadCard from "@/components/organisms/LeadCard";
import InstructionsPanel from "@/components/organisms/InstructionsPanel";
import type { Lead } from "@/lib/types";
import { Badge, Card, EmployeeAvatar, Eyebrow, Heading, Tabs, Text } from "@/components/atoms";
import { ROLE_TITLES } from "@/lib/employees";

const POLL_INTERVAL_MS = 3000;

const FEEDBACK_OPTIONS = ["Wrong tone", "Too long", "Missing personalization", "Other"];

type Props = {
  employeeId: string;
  initialLeads: Lead[];
  initialInstructionsMd: string | null;
  accountManagerId: string | null;
};

const SalesRepresentativeHome = ({
  employeeId,
  initialLeads,
  initialInstructionsMd,
  accountManagerId,
}: Props) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [revealingLeadId, setRevealingLeadId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "instructions">("leads");

  const isDrafting = useMemo(() => leads.some((lead) => lead.draft === ""), [leads]);

  useEffect(() => {
    if (!isDrafting) return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/employees/${employeeId}/drafts`);
      if (!response.ok) return;
      const data = await response.json();
      setLeads(data.leads);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [employeeId, isDrafting]);

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
      // Secondary action — leave locked and let the user retry.
    } finally {
      setRevealingLeadId(null);
    }
  };

  const handleApprove = (id: string) => {
    updateLead(id, (current) => ({ ...current, draftStatus: "approved" }));
    void patchLead(id, { draftStatus: "approved" });
    if (feedbackLeadId === id) setFeedbackLeadId(null);
  };

  const handleReject = (id: string) => {
    updateLead(id, (current) => ({ ...current, draftStatus: "rejected" }));
    void patchLead(id, { draftStatus: "rejected" });
    setFeedbackLeadId(id);
    setEditingLeadId(null);
  };

  const handleToggleEdit = (id: string) => {
    setEditingLeadId((current) => (current === id ? null : id));
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

  const drafting = leads.filter((lead) => lead.draft === "");
  const awaitingApproval = leads.filter((lead) => lead.draft !== "" && lead.draftStatus === "pending");
  const readyToSend = leads.filter((lead) => lead.draftStatus === "approved");
  const rejected = leads.filter((lead) => lead.draftStatus === "rejected");

  const sections: { title: string; items: Lead[] }[] = [
    { title: "Awaiting your approval", items: awaitingApproval },
    { title: "Ready to send", items: readyToSend },
    { title: "Rejected", items: rejected },
  ];

  const leadsTabContent = (
    <>
      <Card as="section" padding="lg">
        <div className="flex items-center gap-4">
          <EmployeeAvatar seed={employeeId} size="lg" />
          <div>
            <Eyebrow>{ROLE_TITLES.sales_representative}</Eyebrow>
            <Heading as="h2" size="md" className="mt-1">
              Oliver is drafting outreach
            </Heading>
            <Text size="sm" tone="muted" className="mt-2 max-w-xl">
              Emma&apos;s approved leads land here for a drafted email — sending
              itself isn&apos;t wired up yet in this preview build.
            </Text>
          </div>
        </div>
      </Card>

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

      {leads.length === 0 && (
        <Card as="section" padding="lg">
          <Text size="sm" tone="muted">
            No leads waiting on outreach yet — approve a lead on Emma&apos;s page to
            send it here.
          </Text>
        </Card>
      )}

      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <Card key={section.title} as="section" padding="lg" className="space-y-4">
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
                    draftText={lead.draft}
                    isEditing={editingLeadId === lead.id}
                    feedbackActive={feedbackLeadId === lead.id}
                    feedbackReason={lead.feedbackReason}
                    feedbackOptions={FEEDBACK_OPTIONS}
                    approvedMessage="Draft approved — ready to send."
                    rejectedNote="Oliver will remember this for next time."
                    onApprove={() => handleApprove(lead.id)}
                    onReject={() => handleReject(lead.id)}
                    onToggleEdit={() => handleToggleEdit(lead.id)}
                    onDraftChange={(value) => handleDraftChange(lead.id, value)}
                    onFeedbackSubmit={handleFeedbackSubmit}
                    onRevealEmail={() => handleRevealEmail(lead.id)}
                    isRevealingEmail={revealingLeadId === lead.id}
                  />
                ))}
              </div>
            </Card>
          ),
      )}
    </>
  );

  return (
    <main className="space-y-10">
      <Tabs
        tabs={[
          { key: "leads", label: "Leads" },
          { key: "instructions", label: "Instructions" },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "leads" && leadsTabContent}
      {activeTab === "instructions" && (
        <InstructionsPanel
          employeeId={employeeId}
          role="sales_representative"
          initialInstructionsMd={initialInstructionsMd}
          accountManagerId={accountManagerId}
        />
      )}
    </main>
  );
};

export default SalesRepresentativeHome;
