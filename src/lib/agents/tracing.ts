import * as ai from "ai";
import { wrapAISDK, createLangSmithProviderOptions } from "langsmith/experimental/vercel";

/**
 * Wraps the AI SDK once so every ToolLoopAgent/generateObject call is traced
 * to LangSmith when LANGSMITH_TRACING is set. No-ops otherwise. See
 * docs/AGENTS.md.
 */
const { ToolLoopAgent, generateObject } = wrapAISDK(ai);

export { ToolLoopAgent, generateObject, createLangSmithProviderOptions };
