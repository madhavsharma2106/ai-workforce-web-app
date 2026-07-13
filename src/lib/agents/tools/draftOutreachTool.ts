import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveDraftEmail } from "@/lib/leads";

/**
 * Writes the outreach draft for the one lead this run was handed off for.
 * The row is bound via `ctx.leadId` (set by the delegation trigger, not
 * model input) — the model only ever drafts for the lead it was briefed on.
 */
export function createDraftOutreachTool(
  supabase: SupabaseClient,
  ctx: { userId: string; runId: string; leadId: string },
) {
  return tool({
    description:
      "Save your personalized outreach email draft for the lead you were handed off. Call this once, after reading the qualification research in your briefing.",
    inputSchema: z.object({
      company: z.string().describe("The company's name, echoed back for narration only."),
      draft: z
        .string()
        .describe(
          "The full outreach email, in your own voice, referencing something concrete from the qualification research — not a generic template.",
        ),
    }),
    execute: async (input) => {
      await saveDraftEmail(supabase, {
        id: ctx.leadId,
        userId: ctx.userId,
        draft: input.draft,
        runId: ctx.runId,
      });
      return { saved: true };
    },
  });
}
