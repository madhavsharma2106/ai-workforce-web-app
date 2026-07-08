import * as ai from "ai";
import { wrapAISDK, createLangSmithProviderOptions } from "langsmith/experimental/vercel";

/**
 * Wraps the AI SDK once so every ToolLoopAgent call (both the live chat
 * route and the LangGraph delegation graph, via runTurn.ts) is traced to
 * LangSmith when LANGSMITH_TRACING is set. No-ops otherwise. See
 * docs/AGENTS.md.
 */
const { ToolLoopAgent } = wrapAISDK(ai);

export { ToolLoopAgent, createLangSmithProviderOptions };
