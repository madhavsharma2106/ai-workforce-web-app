import { NextResponse } from "next/server";
import { ApolloConfigError, ApolloRequestError } from "@/lib/integrations/apollo";
import { searchLeadsForClient } from "@/lib/leadSearch";

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
    const { leads, researched } = await searchLeadsForClient(
      clientDescription,
      badLeadCriteria,
    );

    return NextResponse.json({
      leads,
      researched,
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
