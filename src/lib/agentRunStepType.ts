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
  thinking: "bg-gray-100 text-gray-500",
  tool_call: "bg-(--accent-soft) text-(--accent-hover)",
  tool_result: "bg-(--accent-soft) text-(--accent-hover)",
  message: "bg-gray-900 text-white",
  delegation: "bg-amber-50 text-amber-600",
};

export const AGENT_RUN_STEP_FAILED_CLASSES = "bg-red-50 text-red-600";
