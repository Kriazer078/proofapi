import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { getServices } from "@/lib/services";
import { verifyProof } from "@/lib/verifier";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ result: await verifyProof(getServices().deps, id) });
  } catch (e) {
    return errorResponse(e);
  }
}
