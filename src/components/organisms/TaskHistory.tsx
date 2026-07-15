import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { TaskHistoryItem } from "@/lib/types";
import {
  Badge,
  Card,
  Eyebrow,
  Heading,
  LocalDate,
  Text,
} from "@/components/atoms";
import {
  AGENT_RUN_STATUS_LABEL,
  AGENT_RUN_STATUS_TONE,
} from "@/lib/agentRunStatus";

type Props = {
  employeeId: string;
  history: TaskHistoryItem[];
};

export const TaskHistory = ({ employeeId, history }: Props) => (
  <Card as="section" padding="lg" className="space-y-6">
    <div>
      <Eyebrow>History</Eyebrow>
      <Heading as="h3" size="md" className="mt-1">
        Task history
      </Heading>
    </div>

    {history.length === 0 ? (
      <Text size="sm" tone="muted">
        No previous tasks yet — I&apos;ll show my past runs here.
      </Text>
    ) : (
      <div className="divide-y divide-gray-200">
        {history.map((task) => (
          <Link
            key={task.id}
            href={`/employee/${employeeId}/tasks/${task.id}`}
            className="flex flex-col gap-2 py-4 transition first:pt-0 last:pb-0 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Text size="sm" weight="medium">
                <LocalDate date={task.created_at} />
              </Text>
              <Text size="sm" tone="muted" className="mt-0.5 truncate">
                {task.summary ??
                  `I researched ${task.researchedCount} companies`}
              </Text>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Text size="sm" tone="muted">
                {task.leadCounts.approved} approved · {task.leadCounts.rejected}{" "}
                rejected
              </Text>
              <Badge tone={AGENT_RUN_STATUS_TONE[task.status]} size="sm">
                {AGENT_RUN_STATUS_LABEL[task.status]}
              </Badge>
              <span
                aria-hidden
                className="flex items-center gap-1 rounded-md border border-(--border) px-3 py-1.5 text-sm font-medium text-gray-600"
              >
                View
                <ChevronRight size={14} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    )}
  </Card>
);
