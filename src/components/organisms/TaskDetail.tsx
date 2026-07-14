import type { AgentRun, AgentRunStep, ApprovalStatus, Lead } from "@/lib/types";
import { Badge, Card, EmployeeAvatar, Eyebrow, Heading, LocalDate, Text } from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import ActivityTimeline from "./ActivityTimeline";
import { AGENT_RUN_STATUS_LABEL, AGENT_RUN_STATUS_TONE } from "@/lib/agentRunStatus";
import { ROLE_TITLES } from "@/lib/employees";

const LEAD_STATUS_LABEL: Record<ApprovalStatus, { label: string; tone: "neutral" | "accent" | "danger" }> = {
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

const TaskDetail = ({ employeeId, run, steps, leads }: Props) => {
  return (
    <div className="space-y-8">
      <Card as="section" padding="lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <EmployeeAvatar seed={employeeId} size="lg" />
            <div>
              <Eyebrow>
                {ROLE_TITLES.lead_sourcer} · <LocalDate date={run.created_at} />
              </Eyebrow>
              <Heading as="h1" size="md" className="mt-1">
                Task recap
              </Heading>
            </div>
          </div>
          <Badge tone={AGENT_RUN_STATUS_TONE[run.status]} size="md">
            {AGENT_RUN_STATUS_LABEL[run.status]}
          </Badge>
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

      <Card as="section" padding="lg" className="space-y-6">
        <div>
          <Eyebrow>What happened</Eyebrow>
          <Heading as="h2" size="md" className="mt-1">
            Activity
          </Heading>
        </div>
        <ActivityTimeline steps={steps} />
      </Card>

      <Card as="section" padding="lg" className="space-y-6">
        <div>
          <Eyebrow>Outcome</Eyebrow>
          <Heading as="h2" size="md" className="mt-1">
            Leads from this task
          </Heading>
        </div>
        {leads.length === 0 ? (
          <Text size="sm" tone="muted">
            No leads came out of this task.
          </Text>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id} as="article" padding="md" className="bg-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Text size="sm" weight="semibold">
                      {lead.company}
                    </Text>
                    <Text size="xs" tone="muted" className="font-mono">
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

export default TaskDetail;
