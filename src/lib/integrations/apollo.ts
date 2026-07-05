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
  organization: {
    name: string;
    website_url: string | null;
    primary_domain: string | null;
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

export async function searchPeople(
  criteria: ApolloSearchCriteria,
): Promise<ApolloPerson[]> {
  const { icp } = keywordsFromCriteria(criteria);

  const data = await apolloFetch("/mixed_people/search", {
    q_keywords: icp,
    page: criteria.page ?? 1,
    per_page: criteria.perPage ?? 10,
  });

  const people = Array.isArray(data.people) ? data.people : [];

  return people.map(
    (person: Record<string, unknown>): ApolloPerson => ({
      id: String(person.id),
      name: String(person.name ?? "Unknown"),
      title: (person.title as string) ?? null,
      email: (person.email as string) ?? null,
      organization: person.organization
        ? {
            name: String(
              (person.organization as Record<string, unknown>).name ?? "",
            ),
            website_url:
              ((person.organization as Record<string, unknown>)
                .website_url as string) ?? null,
            primary_domain:
              ((person.organization as Record<string, unknown>)
                .primary_domain as string) ?? null,
          }
        : null,
    }),
  );
}

export async function revealEmail(personId: string): Promise<string | null> {
  const data = await apolloFetch("/people/match", {
    id: personId,
    reveal_personal_emails: true,
  });

  const person = data.person as Record<string, unknown> | undefined;
  return (person?.email as string) ?? null;
}
