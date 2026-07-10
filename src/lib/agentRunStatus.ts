import type { AgentRunStatus } from "@/lib/types";
import type { BadgeTone } from "@/components/atoms";

export const AGENT_RUN_STATUS_LABEL: Record<AgentRunStatus, string> = {
  queued: "Queued",
  running: "In progress",
  waiting_approval: "Needs review",
  completed: "Completed",
  failed: "Failed",
};

export const AGENT_RUN_STATUS_TONE: Record<AgentRunStatus, BadgeTone> = {
  queued: "neutral",
  running: "accent",
  waiting_approval: "warning",
  completed: "success",
  failed: "danger",
};

export const formatRunTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
