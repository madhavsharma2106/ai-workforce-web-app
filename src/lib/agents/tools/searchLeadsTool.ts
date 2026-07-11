import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchPeople, enrichPerson, type ApolloPerson } from "@/lib/integrations/apollo";
import { fetchCompanyText } from "@/lib/integrations/companyWebsite";
import { getFeedbackContext } from "@/lib/leads";

const CANDIDATE_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function domainFromUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
}

export type SearchLeadsResult = {
  searched: string;
  totalFound: number;
  candidates: {
    company: string;
    website: string;
    decisionMaker: string;
    personId?: string;
    research: string | null;
  }[];
  experience: {
    approvedCompanies: string[];
    rejected: { company: string; reason: string | null }[];
  };
};

/**
 * Searches Apollo for candidate leads and researches each new one's site.
 * Both steps are bundled into one tool call — neither has a judgment call in
 * it, so there's no value in forcing a separate tool round-trip per company
 * just to fetch text. The model's actual job is to read the returned
 * candidates and call save_lead for the ones it qualifies — it must not
 * invent candidates beyond what this tool returns.
 */
export function createSearchLeadsTool(
  supabase: SupabaseClient,
  ctx: { userId: string; employeeId: string },
) {
  return tool({
    description:
      "Search Apollo.io for candidate leads matching the client's ideal customer profile. " +
      "Apollo's search is a plain keyword match, not a semantic query — pass a short phrase " +
      "(3-8 words, no punctuation) using terms that would literally appear in a matching " +
      "company's own description or job postings: industry/sector, company type, and any " +
      "explicit target-client language (e.g. \"NGO\", \"nonprofit\", \"fast-moving startup\"). " +
      "Returns each new candidate with whatever research on their site could be found — " +
      "only qualify and save_lead companies present in this result, never invent one.",
    inputSchema: z.object({
      icp: z.string().describe("Short keyword phrase describing the target company profile."),
    }),
    execute: async (input): Promise<SearchLeadsResult> => {
      const feedback = await getFeedbackContext(supabase, {
        userId: ctx.userId,
        employeeId: ctx.employeeId,
      });

      const previews = await searchPeople({ icp: input.icp });

      // Search results are masked previews with no usable organization
      // name/domain — each candidate must be enriched via /people/match
      // (an Apollo credit per call) before we know its real company.
      const enriched = await mapWithConcurrency(previews, CANDIDATE_CONCURRENCY, (person) =>
        enrichPerson(person.id),
      );

      const seen = new Set(feedback.seenDomains);
      const newCandidates: ApolloPerson[] = [];
      for (const person of enriched) {
        if (!person || !person.organization) continue;
        const domain = domainFromUrl(person.organization.primary_domain ?? person.organization.website_url ?? "");
        if (!domain || seen.has(domain)) continue;
        seen.add(domain);
        newCandidates.push(person);
      }

      const researched = await mapWithConcurrency(newCandidates, CANDIDATE_CONCURRENCY, async (person) => {
        const website = person.organization!.primary_domain ?? person.organization!.website_url ?? "";
        const page = website ? await fetchCompanyText(website) : null;
        return { person, website, page };
      });

      return {
        searched: input.icp,
        totalFound: previews.length,
        candidates: researched.map(({ person, website, page }) => ({
          company: person.organization!.name,
          website,
          decisionMaker: person.title ? `${person.name}, ${person.title}` : person.name,
          personId: person.id || undefined,
          research: page ? `${page.title || website}: ${page.text}` : null,
        })),
        experience: {
          approvedCompanies: feedback.approvedCompanies,
          rejected: feedback.rejected,
        },
      };
    },
  });
}
