import { tool } from "ai";
import { z } from "zod";

/**
 * Makes "reviewed and passed" an explicit, defensible decision instead of a
 * silent omission — `save_lead` is the qualification filter in practice
 * (see its own comment), so without this, candidates that weren't saved
 * leave no trace of ever having been considered. Call once per search_leads
 * result, not once per candidate. No DB write: the input is captured
 * automatically via the generic agent_run_steps logging in graph.ts.
 */
export function createNotePassedCandidatesTool() {
  return tool({
    description:
      "Call once after reviewing all candidates from a search_leads result, listing every candidate you did NOT qualify (didn't call save_lead for). Call with an empty array if you qualified every candidate. Each reason must cite something concrete, not a generic pass like 'not a fit' — same bar as save_lead's fit field.",
    inputSchema: z.object({
      passed: z.array(
        z.object({
          company: z.string().describe("The candidate's company name."),
          reason: z
            .string()
            .describe(
              "Why this candidate isn't a good fit — cite something concrete from the research or profile, not a generic dismissal.",
            ),
        }),
      ),
    }),
    execute: async (input) => ({ noted: input.passed.length }),
  });
}
