import { NextResponse } from "next/server";
import {
  ApolloConfigError,
  ApolloRequestError,
} from "@/lib/integrations/apollo";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApolloConfigError) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (error instanceof ApolloRequestError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  console.error("Unhandled API route error", error);
  return NextResponse.json(
    { error: "Something went wrong — try again." },
    { status: 500 },
  );
}
