import { tool } from "ai";
import { z } from "zod";

export type DelegationRequest = {
  to_role: "account_manager" | "lead_sourcer";
  reason: string;
  context?: string;
};

/**
 * Doesn't fire anything itself — records the handoff request via the
 * callback so the graph node wrapper (src/lib/agents/graph.ts) can turn it
 * into a LangGraph `Command` after the turn finishes. See docs/AGENTS.md.
 */
export function createDelegateToEmployeeTool(
  onDelegate: (request: DelegationRequest) => void,
  isRoleHired: (role: DelegationRequest["to_role"]) => boolean,
) {
  return tool({
    description:
      "Hand this off to another employee role when they are genuinely better positioned to continue it. Not for routine work you can do yourself.",
    inputSchema: z.object({
      to_role: z
        .enum(["account_manager", "lead_sourcer"])
        .describe("The role to hand this off to."),
      reason: z
        .string()
        .describe(
          "A short, first-person line explaining the handoff, written as you'd say it directly to the client — e.g. \"she's better positioned to run lead search from here.\" Not internal justification.",
        ),
      context: z
        .string()
        .optional()
        .describe("Any context the next employee needs to pick this up."),
    }),
    execute: async (input) => {
      if (!isRoleHired(input.to_role)) {
        return { handedOff: false, note: `The client hasn't hired anyone for ${input.to_role} yet.` };
      }
      onDelegate(input);
      return { handedOff: true };
    },
  });
}
