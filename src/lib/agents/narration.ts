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
      return `I'm handing this off to ${name}.`;
    },
  },
  save_lead: {
    before: (input) =>
      `I'm queuing ${input.company as string} for your review.`,
  },
  note_passed_candidates: {
    before: () => "I'm reviewing the rest of the candidates.",
    after: (_input, output) => {
      const result = output as { noted: number };
      return result.noted === 0
        ? "Every candidate from this search was qualified."
        : `I passed on ${result.noted} other ${result.noted === 1 ? "candidate" : "candidates"}.`;
    },
  },
  draft_outreach_email: {
    before: (input) => `I'm drafting outreach for ${input.company as string}.`,
    after: () => "I drafted a first outreach email for your review.",
  },
  search_leads: {
    before: (input) =>
      `I'm searching for companies matching "${input.icp as string}".`,
    after: (_input, output) => {
      const result = output as { totalFound: number; candidates: unknown[] };
      if (result.totalFound === 0)
        return "I didn't find any matches for that search.";
      const companyWord = result.totalFound === 1 ? "company" : "companies";
      return `I found ${result.totalFound} ${companyWord}, ${result.candidates.length} new since last search.`;
    },
  },
};

export function narrateBefore(
  toolName: string,
  input: Record<string, unknown>,
): string {
  return NARRATIONS[toolName]?.before(input) ?? "I did some work here.";
}

export function narrateAfter(
  toolName: string,
  input: Record<string, unknown>,
  output: unknown,
): string | null {
  return NARRATIONS[toolName]?.after?.(input, output) ?? null;
}
