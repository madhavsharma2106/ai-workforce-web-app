import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AgentRun } from "@/lib/types";
import { Badge, Card, Heading, LocalDate, Text } from "@/components/atoms";
import {
  AGENT_RUN_STATUS_LABEL,
  AGENT_RUN_STATUS_TONE,
} from "@/lib/agentRunStatus";

type Props<T extends AgentRun> = {
  employeeId: string;
  history: T[];
  /** Right-side detail next to the status badge, e.g. Emma's approved/rejected counts. */
  renderMeta?: (item: T) => ReactNode;
  /** Fallback second line when `item.summary` is null. */
  emptySummary?: (item: T) => string;
};

export const TaskHistory = <T extends AgentRun>({
  employeeId,
  history,
  renderMeta,
  emptySummary,
}: Props<T>) => (
  <Card as="section" padding="lg" className="space-y-5">
    <Heading as="h3" size="sm">
      Task history
    </Heading>

    {history.length === 0 ? (
      <Text size="sm" tone="muted">
        No previous tasks yet — I&apos;ll show my past runs here.
      </Text>
    ) : (
      <div className="divide-y divide-(--border)">
        {history.map((task) => (
          <Link
            key={task.id}
            href={`/employee/${employeeId}/tasks/${task.id}`}
            className="flex flex-col gap-2 py-4 transition first:pt-0 last:pb-0 hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Text size="sm" weight="medium">
                <LocalDate date={task.created_at} />
              </Text>
              <Text size="sm" tone="muted" className="mt-0.5 truncate">
                {task.summary ?? emptySummary?.(task) ?? "Task completed"}
              </Text>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {renderMeta && (
                <Text size="sm" tone="muted">
                  {renderMeta(task)}
                </Text>
              )}
              <Badge tone={AGENT_RUN_STATUS_TONE[task.status]} size="sm">
                {AGENT_RUN_STATUS_LABEL[task.status]}
              </Badge>
              <span
                aria-hidden
                className="flex items-center gap-1 rounded-full bg-(--secondary-bg) px-3.5 py-1.5 text-[13px] font-bold text-(--muted-faint-3)"
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
