import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSystemPrompt } from "@/lib/agents/systemPrompt";
import { createEmployeeAgent } from "@/lib/agents/runTurn";
import { getLeadById } from "@/lib/leads";

/**
 * Runs a nested, tool-free, single-step turn as Alex to answer a specific
 * question — a plain tool call, not a `delegate_to_employee` handoff, so the
 * caller gets the answer back in the same turn instead of ending it. See
 * docs/AGENTS.md.
 */
export function createAskAccountManagerTool(
  supabase: SupabaseClient,
  ctx: { userId: string; accountManagerEmployeeId?: string; leadId?: string },
) {
  return tool({
    description:
      'Ask the Account Manager (Alex) a specific question about the business or a prospect — e.g. "is this company a good fit?" or "which case study fits this prospect?". ' +
      "Call this for a genuine judgment call you can't resolve from the Business Profile already in your instructions, not for anything it already answers.",
    inputSchema: z.object({
      question: z.string().describe("The specific question to ask Alex."),
      context: z
        .string()
        .optional()
        .describe(
          "Anything about this specific situation Alex should know that isn't already implied by the lead you're working on.",
        ),
    }),
    execute: async (input) => {
      if (!ctx.accountManagerEmployeeId) {
        return {
          answered: false,
          note: "The founder hasn't hired an Account Manager yet.",
        };
      }

      const lead = ctx.leadId
        ? await getLeadById(supabase, { id: ctx.leadId, userId: ctx.userId })
        : null;

      const systemPrompt = await buildSystemPrompt({
        supabase,
        userId: ctx.userId,
        role: "account_manager",
        employeeId: ctx.accountManagerEmployeeId,
      });

      const leadContext = lead
        ? `The question is about this prospect: ${lead.company}` +
          (lead.industry ? `, industry: ${lead.industry}` : "") +
          (lead.location ? `, location: ${lead.location}` : "") +
          (lead.employeeCount ? `, ~${lead.employeeCount} employees` : "") +
          (lead.foundedYear ? `, founded ${lead.foundedYear}` : "") +
          (lead.fit ? `. Why this lead was qualified: ${lead.fit}` : "") +
          (lead.researchSnippet
            ? `. Research on them: ${lead.researchSnippet}`
            : "") +
          "\n\n"
        : "";

      const agent = createEmployeeAgent({
        systemPrompt,
        tools: {},
        maxSteps: 1,
        metadata: {
          conversationKind: "ask_account_manager",
          role: "account_manager",
          userId: ctx.userId,
          employeeId: ctx.accountManagerEmployeeId,
        },
      });

      const result = await agent.generate({
        messages: [
          {
            role: "user",
            content: `${leadContext}${input.question}${input.context ? `\n\n${input.context}` : ""}`,
          },
        ],
      });

      return { answered: true, answer: result.text };
    },
  });
}
