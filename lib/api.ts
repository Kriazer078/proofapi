import { NextResponse } from "next/server";
import { ForbiddenError, NotFoundError, RateLimitError, ValidationError } from "./errors";

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ValidationError) return NextResponse.json({ error: e.message, code: e.code }, { status: 400 });
  if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ForbiddenError) return NextResponse.json({ error: e.message, code: e.code }, { status: 403 });
  if (e instanceof RateLimitError) return NextResponse.json({ error: e.message, code: e.code }, { status: 429 });
  console.error(e);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

export type IdContext = { params: Promise<{ id: string }> };
