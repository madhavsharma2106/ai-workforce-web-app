import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertLead } from "@/lib/leads";

/**
 * Persists one qualified lead. The model calls this once per company it
 * judges genuinely qualified after reasoning over the pre-fetched candidate
 * packets (see src/lib/agents/graph.ts) — unqualified candidates are simply
 * never saved, so this tool is the actual qualification filter in practice.
 */
export function createSaveLeadTool(
  supabase: SupabaseClient,
  ctx: { userId: string; employeeId: string; runId: string },
) {
  return tool({
    description:
      "Save one company you've qualified as a genuinely good-fit lead, with a personalized draft outreach email. Only call this for companies you're confident are a real fit — don't call it for every candidate you looked at.",
    inputSchema: z.object({
      company: z.string().describe("The company's name."),
      website: z.string().describe("The company's website/domain."),
      fit: z
        .string()
        .describe(
          "Why this is a good fit — must cite something concrete from the research you were given (a product, a stated focus, a phrase from their site), not generic ICP language like 'matches our target market'.",
        ),
      decisionMaker: z.string().describe("The contact's name and title, e.g. 'Jane Doe, VP Marketing'."),
      draft: z
        .string()
        .describe(
          "A short, personalized outreach email draft that references something concrete from the research and matches the client's tone/value proposition.",
        ),
      sources: z.string().describe("Where this came from, e.g. 'Apollo.io; company site'."),
      personId: z.string().optional().describe("Apollo person id, if this candidate came from Apollo, so their email can be revealed later."),
    }),
    execute: async (input) => {
      await insertLead(supabase, {
        userId: ctx.userId,
        employeeId: ctx.employeeId,
        runId: ctx.runId,
        company: input.company,
        website: input.website,
        fit: input.fit,
        decisionMaker: input.decisionMaker,
        draft: input.draft,
        sources: input.sources,
        personId: input.personId,
      });
      return { saved: true };
    },
  });
}
