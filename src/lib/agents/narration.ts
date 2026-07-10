import { ROLE_LABELS, type EmployeeRole } from "@/lib/employees";

type NarrationEntry = {
  before: (input: Record<string, unknown>) => string;
  after?: (input: Record<string, unknown>, output: unknown) => string;
};

/**
 * On-brand narration copy per tool, keyed by tool name — mirrors the
 * toolsByRole registry pattern. No raw model reasoning is ever shown (see
 * docs/AGENTS.md); every tool needs an entry here or falls back to a
 * generic label.
 */
export const NARRATIONS: Record<string, NarrationEntry> = {
  delegate_to_employee: {
    before: (input) => {
      const toRole = input.to_role as EmployeeRole;
      const name = ROLE_LABELS[toRole] ?? toRole;
      return `Handing this off to ${name}.`;
    },
  },
  save_lead: {
    before: (input) => `Queuing ${input.company as string} for your review.`,
  },
};

export function narrateBefore(toolName: string, input: Record<string, unknown>): string {
  return NARRATIONS[toolName]?.before(input) ?? `Used ${toolName}.`;
}

export function narrateAfter(
  toolName: string,
  input: Record<string, unknown>,
  output: unknown,
): string | null {
  return NARRATIONS[toolName]?.after?.(input, output) ?? null;
}
