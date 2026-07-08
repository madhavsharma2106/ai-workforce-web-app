import { stepCountIs, type ToolSet, type ToolLoopAgentOnStepFinishCallback } from "ai";
import { getModel } from "./model";
import { ToolLoopAgent, createLangSmithProviderOptions } from "./tracing";

/**
 * The one place AI-SDK-specific calls happen. LangGraph nodes (§graph.ts)
 * and the chat route both go through this — if the turn-execution layer
 * ever moves to LangChain, this file is the only thing that changes. See
 * docs/AGENTS.md.
 */
export function createEmployeeAgent<TOOLS extends ToolSet>(input: {
  systemPrompt: string;
  tools: TOOLS;
  onStepFinish?: ToolLoopAgentOnStepFinishCallback<TOOLS>;
  /** Attached to the LangSmith trace for this agent's calls, when tracing is enabled. */
  metadata?: Record<string, unknown>;
}) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: input.systemPrompt,
    tools: input.tools,
    stopWhen: stepCountIs(8),
    onStepFinish: input.onStepFinish,
    providerOptions: input.metadata
      ? { langsmith: createLangSmithProviderOptions({ metadata: input.metadata }) }
      : undefined,
  });
}
