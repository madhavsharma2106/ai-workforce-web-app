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
    before: (input) => {
      const company = input.company as string;
      const fit = input.fit as string;
      return `I'm queuing ${company} for your review: ${fit}`;
    },
  },
  note_passed_candidates: {
    before: () => "I'm reviewing the rest of the candidates.",
    after: (input, output) => {
      const result = output as { noted: number };
      if (result.noted === 0)
        return "Every candidate from this search was qualified.";
      const passed =
        (input.passed as { company: string; reason: string }[] | undefined) ??
        [];
      const word = result.noted === 1 ? "candidate" : "candidates";
      const reasons = passed
        .map((c) => `- **${c.company}**: ${c.reason}`)
        .join("\n");
      return `I passed on ${result.noted} other ${word}:\n\n${reasons}`;
    },
  },
  draft_outreach_email: {
    before: (input) => `I'm drafting outreach for ${input.company as string}.`,
    after: () => "I drafted a first outreach email for your review.",
  },
  draft_reply_email: {
    before: () => "I'm drafting a reply to what they said.",
    after: () => "I drafted a reply for your review.",
  },
  ask_account_manager: {
    before: (input) => `I'm checking with Alex: "${input.question as string}"`,
    after: (_input, output) => {
      const result = output as {
        answered: boolean;
        answer?: string;
        note?: string;
      };
      if (!result.answered) return result.note ?? "Alex isn't hired yet.";
      return `Alex says: ${result.answer}`;
    },
  },
  web_search: {
    before: (input) =>
      `I'm checking for recent news: "${input.query as string}"`,
    after: (_input, output) => {
      const results = output as { url: string; title: string | null }[];
      if (results.length === 0) return "Nothing recent turned up.";
      const word = results.length === 1 ? "result" : "results";
      return `I found ${results.length} recent ${word} to draw on.`;
    },
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
