import { fetchCompanyText, type CompanyPage } from "@/lib/integrations/companyWebsite";
import type { OnboardingTranscriptEntry } from "@/lib/onboardingQuestions";

const MAX_URLS_PER_TRANSCRIPT = 3;
const CACHE_TTL_MS = 5 * 60_000;

const COMMON_TLDS = "com|io|co|net|org|ai|dev|app";
const URL_PATTERN = new RegExp(
  `(https?:\\/\\/[^\\s<>"')]+)|(\\bwww\\.[^\\s<>"')]+)|(\\b[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${COMMON_TLDS})(?:\\/[^\\s<>"')]*)?\\b)`,
  "gi",
);

/** Pulls URLs a founder typed in free text — with or without a scheme. */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const match of matches) {
    const trimmed = match.replace(/[.,;:!?]+$/, "");
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    urls.push(trimmed);
  }
  return urls;
}

const cache = new Map<string, { page: CompanyPage | null; expiresAt: number }>();

/** Avoids re-fetching the same URL on every later turn of a chat session. */
async function fetchCached(url: string): Promise<CompanyPage | null> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expiresAt > now) return hit.page;

  const page = await fetchCompanyText(url);
  cache.set(url, { page, expiresAt: now + CACHE_TTL_MS });
  return page;
}

/**
 * Fetches every URL the founder has shared so far in a chat transcript and
 * formats a context block for the LLM prompt. Empty string when nothing was
 * shared or every fetch failed — callers append this straight onto their
 * existing transcript text, no special-casing needed.
 */
export async function buildReferencedPageContext(
  transcript: OnboardingTranscriptEntry[],
): Promise<string> {
  const urls = transcript
    .flatMap((entry) => extractUrls(entry.answer))
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, MAX_URLS_PER_TRANSCRIPT);

  if (urls.length === 0) return "";

  const results = await Promise.all(
    urls.map(async (url) => ({ url, page: await fetchCached(url) })),
  );

  const sections = results
    .filter((result): result is { url: string; page: CompanyPage } => result.page !== null)
    .map(({ url, page }) => `### ${url} — "${page.title || url}"\n${page.text}`);

  if (sections.length === 0) return "";

  return `Pages the founder linked to (fetched content — ground business specifics in this where relevant, don't invent beyond it):\n${sections.join("\n\n")}`;
}
