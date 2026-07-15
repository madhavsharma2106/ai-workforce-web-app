const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

export class ApolloConfigError extends Error {
  constructor() {
    super(
      "APOLLO_API_KEY is not configured. Add it to .env.local to enable lead search.",
    );
    this.name = "ApolloConfigError";
  }
}

export class ApolloRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApolloRequestError";
  }
}

function getApiKey(): string {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new ApolloConfigError();
  return apiKey;
}

async function apolloFetch(path: string, body: Record<string, unknown>) {
  const apiKey = getApiKey();
  const response = await fetch(`${APOLLO_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ApolloRequestError(
      `Apollo request to ${path} failed with status ${response.status}: ${detail}`,
    );
  }

  return response.json();
}

export type ApolloPerson = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  seniority: string | null;
  departments: string[];
  organization: {
    name: string;
    website_url: string | null;
    primary_domain: string | null;
    industry: string | null;
    estimated_num_employees: number | null;
    founded_year: number | null;
    location: string | null;
    linkedin_url: string | null;
  } | null;
};

export type ApolloSearchCriteria = {
  icp: string;
  excludeCriteria?: string;
  page?: number;
  perPage?: number;
};

function keywordsFromCriteria({ icp, excludeCriteria }: ApolloSearchCriteria) {
  // Simple heuristic: Apollo's search API takes structured filters, not
  // free-text ICP descriptions. We just forward the raw ICP text as a
  // keyword search for now — good enough to return relevant results
  // without needing an LLM to parse it into structured filters.
  return { icp, excludeCriteria };
}

function locationFromOrg(org: Record<string, unknown>): string | null {
  const parts = [org.city, org.state, org.country].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function parseApolloPerson(
  person: Record<string, unknown>,
  fallbackId: string,
): ApolloPerson {
  const org = person.organization as Record<string, unknown> | undefined;

  return {
    id: String(person.id ?? fallbackId),
    name: String(person.name ?? "Unknown"),
    title: (person.title as string) ?? null,
    email: (person.email as string) ?? null,
    linkedin_url: (person.linkedin_url as string) ?? null,
    seniority: (person.seniority as string) ?? null,
    departments: Array.isArray(person.departments)
      ? (person.departments as string[])
      : [],
    organization: org
      ? {
          name: String(org.name ?? ""),
          website_url: (org.website_url as string) ?? null,
          primary_domain: (org.primary_domain as string) ?? null,
          industry: (org.industry as string) ?? null,
          estimated_num_employees:
            (org.estimated_num_employees as number) ?? null,
          founded_year: (org.founded_year as number) ?? null,
          location: locationFromOrg(org),
          linkedin_url: (org.linkedin_url as string) ?? null,
        }
      : null,
  };
}

/**
 * Search results are masked previews — `organization.name` comes back as the
 * literal placeholder string "organization" and there's no
 * website_url/primary_domain at all. Every candidate needs `enrichPerson`
 * (below) before its real company name/domain is usable.
 */
export async function searchPeople(
  criteria: ApolloSearchCriteria,
): Promise<ApolloPerson[]> {
  const { icp } = keywordsFromCriteria(criteria);

  const data = await apolloFetch("/mixed_people/api_search", {
    q_keywords: icp,
    page: criteria.page ?? 1,
    per_page: criteria.perPage ?? 10,
  });

  const people = Array.isArray(data.people) ? data.people : [];

  return people.map((person: Record<string, unknown>) =>
    parseApolloPerson(person, String(person.id)),
  );
}

/**
 * Unlocks a candidate's real name and organization (name/website/domain) via
 * `/people/match` — this is what actually populates the fields search
 * results only preview. Costs an Apollo credit per call. Does not reveal the
 * personal email; use `revealEmail` for that separately.
 */
export async function enrichPerson(
  personId: string,
): Promise<ApolloPerson | null> {
  const data = await apolloFetch("/people/match", { id: personId });
  const person = data.person as Record<string, unknown> | undefined;
  if (!person) return null;
  return parseApolloPerson(person, personId);
}

export async function revealEmail(personId: string): Promise<string | null> {
  const data = await apolloFetch("/people/match", {
    id: personId,
    reveal_personal_emails: true,
  });

  const person = data.person as Record<string, unknown> | undefined;
  return (person?.email as string) ?? null;
}
