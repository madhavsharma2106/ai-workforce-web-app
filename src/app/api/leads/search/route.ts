import { NextResponse } from "next/server";
import {
  ApolloConfigError,
  ApolloRequestError,
  searchPeople,
} from "@/lib/integrations/apollo";
import type { Lead } from "@/lib/dummyLeads";

export async function POST(request: Request) {
  const body = await request.json();
  const clientDescription = String(body.clientDescription ?? "");
  const badLeadCriteria = String(body.badLeadCriteria ?? "");

  if (!clientDescription) {
    return NextResponse.json(
      { error: "clientDescription is required" },
      { status: 400 },
    );
  }

  try {
    const people = await searchPeople({
      icp: clientDescription,
      excludeCriteria: badLeadCriteria,
    });

    const leads: Lead[] = people
      .filter((person) => person.organization)
      .map((person, index) => ({
        id: index + 1,
        company: person.organization!.name,
        website:
          person.organization!.primary_domain ??
          person.organization!.website_url ??
          "",
        fit: `Matches ICP: ${clientDescription}`,
        decisionMaker: person.title
          ? `${person.name}, ${person.title}`
          : person.name,
        email: "",
        draft: `Hi ${person.name.split(" ")[0]}, I came across ${person.organization!.name} and thought there could be a good fit here. Would love to share more.`,
        sources: "Apollo.io",
        personId: person.id,
        emailRevealed: false,
      }));

    return NextResponse.json({
      leads,
      researched: people.length,
      focus: clientDescription,
    });
  } catch (error) {
    if (error instanceof ApolloConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof ApolloRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
