import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { saveDraftEmail } from "@/lib/leads";

// Belt-and-suspenders guard against the model's habit of writing "Subject:
// ..." as the first line of the body even though `subject` is now a
// separate field — Graph then sends/saves with an empty subject and a
// redundant "Subject:" line baked into the visible body. Strips that line
// out of `draft` and backfills `subject` from it if `subject` came back
// empty, so the founder never sees this artifact regardless of what the
// model actually does.
function normalizeSubjectAndDraft(
  subject: string,
  draft: string,
): { subject: string; draft: string } {
  const lines = draft.split("\n");
  const match = /^subject:\s*(.+)$/i.exec(lines[0]?.trim() ?? "");
  if (!match) return { subject, draft };

  const remainder = lines
    .slice(1)
    .join("\n")
    .replace(/^\s*\n+/, "");
  return { subject: subject.trim() || match[1].trim(), draft: remainder };
}

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
      company: z
        .string()
        .describe("The company's name, echoed back for narration only."),
      subject: z
        .string()
        .describe(
          "The email's subject line ONLY — specific to this prospect, not generic. Do not include a 'Subject:' prefix; this is a separate field from the body, not a line within it.",
        ),
      draft: z
        .string()
        .describe(
          "The full outreach email BODY only, in your own voice, referencing something concrete from the qualification research — not a generic template. Start directly with the greeting; do not repeat the subject line or a 'Subject:' line inside the body.",
        ),
    }),
    execute: async (input) => {
      const { subject, draft } = normalizeSubjectAndDraft(
        input.subject,
        input.draft,
      );
      await saveDraftEmail(supabase, {
        id: ctx.leadId,
        userId: ctx.userId,
        subject,
        draft,
        runId: ctx.runId,
      });
      return { saved: true };
    },
  });
}
