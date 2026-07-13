import Link from "next/link";
import LeadCard from "@/components/organisms/LeadCard";
import PassedCandidatesList from "@/components/organisms/PassedCandidatesList";
import type { AgentRun, Lead } from "@/lib/types";
import { Badge, Button, Card, EmployeeAvatar, Eyebrow, Heading, LocalDate, Text } from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import { ROLE_TITLES } from "@/lib/employees";

type Props = {
  employeeId: string;
  run: AgentRun;
  leads: Lead[];
  researchedCount: number;
  pendingCount: number;
  approvedCount: number;
  oliverHired: boolean;
  feedbackLeadId: string | null;
  revealingLeadId: string | null;
  passedCandidates: { company: string; reason: string }[];
  onSearchAgain: () => void;
  onApproveAll: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevealEmail: (id: string) => void;
  onFeedbackSubmit: (reason: string) => void;
};

const RunReviewPanel = ({
  employeeId,
  run,
  leads,
  researchedCount,
  pendingCount,
  approvedCount,
  oliverHired,
  feedbackLeadId,
  revealingLeadId,
  passedCandidates,
  onSearchAgain,
  onApproveAll,
  onApprove,
  onReject,
  onRevealEmail,
  onFeedbackSubmit,
}: Props) => (
  <>
    <Card as="section" padding="lg">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <EmployeeAvatar seed={employeeId} size="lg" />
          <div>
            <Eyebrow>
              {ROLE_TITLES.lead_sourcer} · <LocalDate date={run.created_at} />
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
          <Button variant="secondary" size="sm" onClick={onSearchAgain}>
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
        <Eyebrow>Update from Emma</Eyebrow>
        <blockquote className="mt-4 border-l-2 border-gray-900 pl-4">
          <Markdown content={run.summary} />
        </blockquote>
      </Card>
    )}

    {!oliverHired && (
      <Card as="section" padding="md" className="border-indigo-200 bg-indigo-50">
        <Text size="sm" className="text-indigo-900">
          <span className="font-medium">Hire Oliver (Sales Representative)</span>{" "}
          to draft and approve outreach for leads you approve here.{" "}
          <Link href="/dashboard" className="underline underline-offset-2">
            Hire Oliver
          </Link>
        </Text>
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
        <Button className="px-4!" onClick={onApproveAll} disabled={!oliverHired}>
          Approve all
        </Button>
      </div>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            status={lead.status}
            showDraft={false}
            approvedMessage="Approved — handed off to Oliver for outreach."
            approveDisabled={!oliverHired}
            feedbackActive={feedbackLeadId === lead.id}
            feedbackReason={lead.feedbackReason}
            onApprove={() => onApprove(lead.id)}
            onReject={() => onReject(lead.id)}
            onRevealEmail={() => onRevealEmail(lead.id)}
            isRevealingEmail={revealingLeadId === lead.id}
            onFeedbackSubmit={onFeedbackSubmit}
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

    <PassedCandidatesList candidates={passedCandidates} />
  </>
);

export default RunReviewPanel;
