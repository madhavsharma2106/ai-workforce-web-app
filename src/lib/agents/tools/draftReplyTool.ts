import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveReplyDraft } from "@/lib/leads";

/**
 * Writes the reply draft for the one lead this run was handed off for. The
 * row is bound via `ctx.leadId` (set by the delegation trigger, not model
 * input) — the model only ever drafts a reply for the lead it was briefed
 * on. Mirrors draftOutreachTool.ts; kept as a separate tool (rather than
 * branching draft_outreach_email on an argument) so toolsByRole.ts can
 * expose exactly one of the two per run — see the jobKind guard there.
 */
export function createDraftReplyTool(
  supabase: SupabaseClient,
  ctx: { userId: string; runId: string; leadId: string },
) {
  return tool({
    description:
      "Save your drafted reply to the prospect's message for the lead you were handed off. Call this once, after reading what the prospect said in your briefing.",
    inputSchema: z.object({
      reply: z
        .string()
        .describe(
          "The full reply email BODY only, in your own voice, directly responding to what the prospect actually said — not a generic follow-up template. Start directly with the greeting; do not include a subject line, since this is a threaded reply and keeps the original subject.",
        ),
    }),
    execute: async (input) => {
      await saveReplyDraft(supabase, {
        id: ctx.leadId,
        userId: ctx.userId,
        replyDraft: input.reply,
        runId: ctx.runId,
      });
      return { saved: true };
    },
  });
}
