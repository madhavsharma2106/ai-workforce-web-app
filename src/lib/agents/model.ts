import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel, Tool } from "ai";

/**
 * The only place a provider package is imported. Every call site gets its
 * model through this function so a future provider (or a second one) is a
 * change here, not a rewrite of call sites. See docs/AGENTS.md.
 */
export function getModel(): LanguageModel {
  return anthropic("claude-sonnet-5");
}

/**
 * Claude's server-side web search — Claude issues the query and reads
 * results itself, no separate search API/key. Must be registered under the
 * key `web_search` in a tool set (Anthropic's fixed name for this built-in
 * tool). `maxUses` caps searches per turn to bound latency/cost — this is a
 * grounding lookup, not an open-ended research tool.
 */
export function getWebSearchTool(maxUses = 2): Tool {
  return anthropic.tools.webSearch_20260209({ maxUses });
}
