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
 * Blocks requests to loopback/private/link-local hosts and the cloud
 * metadata address. Callers besides Apollo-sourced domains now feed this
 * function founder-typed URLs, which are attacker-controlled input — this
 * is a literal-host check only (no DNS-rebinding protection), but it's
 * enough to stop the obvious SSRF cases.
 */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "169.254.169.254") return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;
  return false;
}

/**
 * Fetches a page's content and extracts readable text for an LLM to reason
 * over. Returns null on any failure (timeout, bot-block, non-HTML, network
 * error, or a blocked host) rather than throwing — callers must treat null
 * as "no research available" and avoid inventing specifics about the page.
 */
export async function fetchCompanyText(url: string): Promise<CompanyPage | null> {
  const normalized = normalizeUrl(url);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }
  if (isBlockedHost(parsed.hostname)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(normalized, {
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
