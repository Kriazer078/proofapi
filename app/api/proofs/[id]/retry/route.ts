import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

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
