import { NextResponse } from "next/server";
import { ApolloConfigError, ApolloRequestError, searchPeople } from "@/lib/integrations/apollo";

/**
 * Raw Apollo connectivity probe — not part of the Lead Sourcer flow (that
 * runs through the LangGraph delegation graph, see src/lib/agents/graph.ts).
 * Returns unqualified candidates as-is; useful for manually checking Apollo
 * search results without spending an LLM call.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const clientDescription = String(body.clientDescription ?? "");

  if (!clientDescription) {
    return NextResponse.json(
      { error: "clientDescription is required" },
      { status: 400 },
    );
  }

  try {
    const people = await searchPeople({ icp: clientDescription });
    return NextResponse.json({ people, focus: clientDescription });
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
