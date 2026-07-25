import type { AgentRun, AgentRunStep, ApprovalStatus, Lead } from "@/lib/types";
import {
  Badge,
  Card,
  EmployeeAvatar,
  Heading,
  LocalDate,
  Text,
} from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import { ActivityCard } from "./ActivityCard";
import {
  AGENT_RUN_STATUS_LABEL,
  AGENT_RUN_STATUS_TONE,
} from "@/lib/agentRunStatus";
import { ROLE_TITLES } from "@/lib/employees";

const LEAD_STATUS_LABEL: Record<
  ApprovalStatus,
  { label: string; tone: "neutral" | "accent" | "danger" }
> = {
  pending: { label: "Pending", tone: "neutral" },
  approved: { label: "Approved", tone: "accent" },
  rejected: { label: "Rejected", tone: "danger" },
};

type Props = {
  employeeId: string;
  run: AgentRun;
  steps: AgentRunStep[];
  leads: Lead[];
};

export const TaskDetail = ({ employeeId, run, steps, leads }: Props) => {
  return (
    <div className="mx-auto max-w-190 space-y-9">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <EmployeeAvatar seed={employeeId} size="lg" />
          <div>
            <Heading as="h1" size="xl" italic>
              Task recap
            </Heading>
            <Text size="sm" tone="muted" className="mt-1">
              {ROLE_TITLES.lead_sourcer} · <LocalDate date={run.created_at} />
            </Text>
          </div>
        </div>
        <Badge tone={AGENT_RUN_STATUS_TONE[run.status]} size="md">
          {AGENT_RUN_STATUS_LABEL[run.status]}
        </Badge>
      </div>

      {run.summary && (
        <Card as="article" padding="lg" className="space-y-3.5">
          <Heading as="h3" size="sm">
            Update from Emma
          </Heading>
          <Markdown content={run.summary} />
        </Card>
      )}

      <ActivityCard steps={steps} />

      <Card as="section" padding="lg" className="space-y-5">
        <Heading as="h2" size="sm">
          Leads from this task
        </Heading>
        {leads.length === 0 ? (
          <Text size="sm" tone="muted">
            No leads came out of this task.
          </Text>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card
                key={lead.id}
                as="article"
                padding="md"
                className="bg-(--inset)"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Text size="sm" weight="semibold">
                      {lead.company}
                    </Text>
                    <Text size="xs" className="text-(--muted-faint)">
                      {lead.website}
                    </Text>
                  </div>
                  <Badge tone={LEAD_STATUS_LABEL[lead.status].tone} size="sm">
                    {LEAD_STATUS_LABEL[lead.status].label}
                  </Badge>
                </div>
                <Text size="sm" tone="muted" className="mt-3">
                  {lead.fit}
                </Text>
                {lead.status === "rejected" && lead.feedbackReason && (
                  <Text size="xs" tone="muted" className="mt-2">
                    Feedback: {lead.feedbackReason}
                  </Text>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
