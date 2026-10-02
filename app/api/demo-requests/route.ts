import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { parseDemoRequest, submitDemoRequest } from "@/lib/demo-requests";
import { ValidationError } from "@/lib/errors";
import { clientIpHash } from "@/lib/request-access";
import { getDemoRequests } from "@/lib/services";

/** Website demo form. A filled hidden field marks a bot: it gets a normal answer and nothing is stored. */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ValidationError("Send the form as JSON", "bad_request");
    if (typeof body.website === "string" && body.website.trim() !== "")
      return NextResponse.json({ ok: true }, { status: 201 });
    const input = parseDemoRequest(body);
    await submitDemoRequest(getDemoRequests(), input, await clientIpHash());
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
