const FETCH_TIMEOUT_MS = 8_000;
const MAX_TEXT_LENGTH = 4_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AIWorkforceBot/1.0; +https://ai-workforce.example/bot)";

export type CompanyPage = { title: string; text: string };

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&nbsp;": " ",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEntities(input: string): string {
  return input.replace(/&(amp|nbsp|quot|#39|lt|gt);/g, (match) => ENTITY_MAP[match] ?? match);
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : "";
}

function extractText(html: string): string {
  const withoutNonContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutNonContent.replace(/<[^>]+>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Fetches a company's homepage and extracts readable text for an LLM to
 * reason over. Returns null on any failure (timeout, bot-block, non-HTML,
 * network error) rather than throwing — callers must treat null as "no
 * research available" and avoid inventing specifics about the company.
 */
export async function fetchCompanyText(url: string): Promise<CompanyPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(normalizeUrl(url), {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) return null;

    const html = await response.text();
    const text = extractText(html).slice(0, MAX_TEXT_LENGTH);
    if (!text) return null;

    return { title: extractTitle(html), text };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
