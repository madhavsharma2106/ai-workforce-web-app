import { NextResponse } from "next/server";
import {
  ApolloConfigError,
  ApolloRequestError,
  revealEmail,
} from "@/lib/integrations/apollo";

export async function POST(request: Request) {
  const body = await request.json();
  const personId = String(body.personId ?? "");

  if (!personId) {
    return NextResponse.json(
      { error: "personId is required" },
      { status: 400 },
    );
  }

  try {
    const email = await revealEmail(personId);
    return NextResponse.json({ email });
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
