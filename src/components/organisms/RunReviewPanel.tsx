import Link from "next/link";
import { LeadCard } from "./LeadCard";
import { PassedCandidatesList } from "./PassedCandidatesList";
import { ActivityCard } from "./ActivityCard";
import type { AgentRun, AgentRunStep, Lead } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmployeeAvatar,
  Eyebrow,
  Heading,
  LocalDate,
  Text,
} from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import { ROLE_TITLES } from "@/lib/employees";

type Props = {
  employeeId: string;
  run: AgentRun;
  leads: Lead[];
  steps: AgentRunStep[];
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

export const RunReviewPanel = ({
  employeeId,
  run,
  leads,
  steps,
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
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <EmployeeAvatar seed={employeeId} size="lg" />
        <div>
          <Heading as="h2" size="xl" italic>
            {pendingCount > 0
              ? `I found ${pendingCount} ${pendingCount === 1 ? "lead" : "leads"} for you to review`
              : "I'm all caught up"}
          </Heading>
          <Text size="sm" tone="muted" className="mt-1">
            {ROLE_TITLES.lead_sourcer} · <LocalDate date={run.created_at} />
          </Text>
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

    <div className="grid gap-3.5 sm:grid-cols-3">
      {[
        { label: "Researched", value: `${researchedCount} companies` },
        { label: "Qualified", value: `${leads.length} leads` },
        { label: "In queue", value: `${pendingCount} for review` },
      ].map((stat) => (
        <Card key={stat.label} padding="md">
          <Eyebrow>{stat.label}</Eyebrow>
          <Heading as="p" size="md" className="mt-1.5">
            {stat.value}
          </Heading>
        </Card>
      ))}
    </div>

    {run.summary && (
      <Card as="article" padding="lg" className="space-y-3.5">
        <Heading as="h3" size="sm">
          Today&apos;s report
        </Heading>
        <Markdown content={run.summary} />
      </Card>
    )}

    <ActivityCard steps={steps} />

    {!oliverHired && (
      <Card as="section" padding="md">
        <Text size="sm" tone="subtle">
          <span className="font-bold text-(--heading)">
            Hire Oliver (Sales Representative)
          </span>{" "}
          to draft and approve outreach for leads you approve here.{" "}
          <Link href="/dashboard" className="underline underline-offset-2">
            Hire Oliver
          </Link>
        </Text>
      </Card>
    )}

    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Heading as="h3" size="sm">
            Ready to grow
          </Heading>
          <Text size="sm" tone="muted" className="mt-1">
            Review before I hand these to Oliver to draft outreach.
          </Text>
        </div>
        <Button onClick={onApproveAll} disabled={!oliverHired}>
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
            approveLabel="Nurture this"
            rejectLabel="Let go"
            approvedMessage="Approved — I've handed this off to Oliver for outreach."
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

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-(--inset) p-5">
        <div>
          <Text size="sm" weight="medium">
            Approval progress
          </Text>
          <Text size="sm" tone="muted" className="mt-0.5">
            {approvedCount} approved • {pendingCount} pending
          </Text>
        </div>
        <Badge tone="accent" size="sm">
          I&apos;m learning from your feedback
        </Badge>
      </div>
    </div>

    <PassedCandidatesList candidates={passedCandidates} />
  </>
);
