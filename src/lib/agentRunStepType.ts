import {
  Brain,
  FileSearch,
  MessageSquare,
  Share2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AgentRunStepType } from "@/lib/types";

export const AGENT_RUN_STEP_TYPE_ICON: Record<AgentRunStepType, LucideIcon> = {
  thinking: Brain,
  tool_call: Wrench,
  tool_result: FileSearch,
  message: MessageSquare,
  delegation: Share2,
};

export const AGENT_RUN_STEP_TYPE_CLASSES: Record<AgentRunStepType, string> = {
  thinking: "bg-(--inset) text-(--muted-faint)",
  tool_call: "bg-(--accent-soft) text-(--accent-soft-text)",
  tool_result: "bg-(--accent-soft) text-(--accent-soft-text)",
  message: "bg-(--accent) text-white",
  delegation: "bg-(--accent-soft-2) text-(--accent-soft-2-text)",
};

export const AGENT_RUN_STEP_FAILED_CLASSES = "bg-red-50 text-red-600";
