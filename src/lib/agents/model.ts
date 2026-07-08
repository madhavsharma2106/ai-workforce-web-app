import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * The only place a provider package is imported. Every call site gets its
 * model through this function so a future provider (or a second one) is a
 * change here, not a rewrite of call sites. See docs/AGENTS.md.
 */
export function getModel(): LanguageModel {
  return anthropic("claude-sonnet-5");
}
