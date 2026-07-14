"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { AgentRunStep } from "@/lib/types";
import { LocalDate, Text } from "@/components/atoms";
import { Markdown } from "@/components/molecules";
import {
  AGENT_RUN_STEP_FAILED_CLASSES,
  AGENT_RUN_STEP_TYPE_CLASSES,
  AGENT_RUN_STEP_TYPE_ICON,
} from "@/lib/agentRunStepType";

const STEP_TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

type Props = {
  steps: AgentRunStep[];
};

const ActivityTimeline = ({ steps }: Props) => {
  const narrated = steps.filter((step) => step.label);

  if (narrated.length === 0) {
    return (
      <Text size="sm" tone="muted">
        No activity recorded for this task.
      </Text>
    );
  }

  return (
    <ol className="space-y-0">
      {narrated.map((step, index) => (
        <ActivityStep key={step.id} step={step} isLast={index === narrated.length - 1} />
      ))}
    </ol>
  );
};

const ActivityStep = ({ step, isLast }: { step: AgentRunStep; isLast: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const failed = step.status === "failed";
  const Icon = failed ? AlertTriangle : AGENT_RUN_STEP_TYPE_ICON[step.type];
  const iconClasses = failed ? AGENT_RUN_STEP_FAILED_CLASSES : AGENT_RUN_STEP_TYPE_CLASSES[step.type];
  const hasDetail = step.input != null || step.output != null;

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconClasses}`}>
          <Icon size={14} strokeWidth={2} />
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 bg-gray-200" />}
      </div>
      <div className="min-w-0 flex-1 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Markdown content={step.label ?? ""} />
          </div>
          <Text size="xs" tone="muted" className="mt-0.5 shrink-0 whitespace-nowrap">
            <LocalDate date={step.created_at} options={STEP_TIME_OPTIONS} />
          </Text>
        </div>
        {hasDetail && (
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-800"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {expanded ? "Hide details" : "Show details"}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 rounded-md bg-gray-50 p-3">
                {step.tool_name && (
                  <Text size="xs" tone="muted" className="font-mono">
                    {step.tool_name}
                  </Text>
                )}
                {step.input != null && (
                  <pre className="overflow-x-auto text-xs text-gray-600">
                    {JSON.stringify(step.input, null, 2)}
                  </pre>
                )}
                {step.output != null && (
                  <pre className="overflow-x-auto text-xs text-gray-600">
                    {JSON.stringify(step.output, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

export default ActivityTimeline;
