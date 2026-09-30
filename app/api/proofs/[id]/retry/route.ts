import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { proofs, chain } = getServices();
    const { proof, chainError } = await proofs.retryAnchoring(id);
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError });
  } catch (e) {
    return errorResponse(e);
  }
}
