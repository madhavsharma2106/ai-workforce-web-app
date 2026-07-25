import { NextResponse } from "next/server";
import {
  ApolloConfigError,
  ApolloRequestError,
} from "@/lib/integrations/apollo";
import { log } from "@/lib/log";

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApolloConfigError) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (error instanceof ApolloRequestError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  log.error("Unhandled API route error", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    { error: "Something went wrong — try again." },
    { status: 500 },
  );
}
