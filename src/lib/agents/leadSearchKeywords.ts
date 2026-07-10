import { z } from "zod";
import { getModel } from "@/lib/agents/model";
import { generateObject } from "@/lib/agents/tracing";

const keywordsSchema = z.object({ keywords: z.string() });

/** Last-resort fallback if the extraction call fails — degrades to a generic search rather than blocking the run. */
const FALLBACK_KEYWORDS = "small business";

/**
 * Turns a free-form Business Profile into a short keyword phrase Apollo's
 * search can actually match on — the profile is a multi-paragraph markdown
 * document (see businessProfile.ts), but Apollo's q_keywords is a plain
 * keyword search, not a semantic query, so handing it the whole document
 * verbatim returns nothing.
 */
export async function extractSearchKeywords(profileMd: string): Promise<string> {
  const prompt = `Turn this Business Profile into a short keyword phrase for an outbound lead-search tool (Apollo.io's people/company search). It's a plain keyword match, not a semantic search — so give the kind of terms that would literally appear in a matching company's own description or job postings: industry/sector, company type, and any explicit target-client language (e.g. "NGO", "nonprofit", "fast-moving startup"). 3-8 words, no punctuation or markdown, just the keywords.

Business Profile:
${profileMd}`;

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: keywordsSchema,
      prompt,
    });
    return object.keywords.trim() || FALLBACK_KEYWORDS;
  } catch {
    return FALLBACK_KEYWORDS;
  }
}
