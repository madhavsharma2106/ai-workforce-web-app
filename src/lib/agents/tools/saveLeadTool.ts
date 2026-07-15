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
      "Save one company you've qualified as a genuinely good-fit lead. Only call this for companies you're confident are a real fit — don't call it for every candidate you looked at. The Sales Representative drafts the outreach email once the founder approves this lead.",
    inputSchema: z.object({
      company: z.string().describe("The company's name."),
      website: z.string().describe("The company's website/domain."),
      fit: z
        .string()
        .describe(
          "Why this is a good fit — must cite something concrete from the research you were given (a product, a stated focus, a phrase from their site), not generic ICP language like 'matches our target market'.",
        ),
      decisionMaker: z
        .string()
        .describe(
          "The contact's name and title, e.g. 'Jane Doe, VP Marketing'.",
        ),
      sources: z
        .string()
        .describe("Where this came from, e.g. 'Apollo.io; company site'."),
      personId: z
        .string()
        .optional()
        .describe(
          "Apollo person id, if this candidate came from Apollo, so their email can be revealed later.",
        ),
      researchSnippet: z
        .string()
        .describe(
          "A short, literal factual detail from the research you were given — the page's title, a specific stated fact — not your interpretation (that's what fit is for). If no site research was available for this candidate, say so honestly, e.g. 'No company site content found — qualified from Apollo profile data only.'",
        ),
      industry: z
        .string()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      employeeCount: z
        .number()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      location: z
        .string()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      foundedYear: z
        .number()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      companyLinkedinUrl: z
        .string()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      contactLinkedinUrl: z
        .string()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      seniority: z
        .string()
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
      departments: z
        .array(z.string())
        .optional()
        .describe(
          "Copied exactly from the candidate's data. Leave unset if not provided.",
        ),
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
        sources: input.sources,
        personId: input.personId,
        researchSnippet: input.researchSnippet,
        industry: input.industry,
        employeeCount: input.employeeCount,
        location: input.location,
        foundedYear: input.foundedYear,
        companyLinkedinUrl: input.companyLinkedinUrl,
        contactLinkedinUrl: input.contactLinkedinUrl,
        seniority: input.seniority,
        departments: input.departments,
      });
      return { saved: true };
    },
  });
}
