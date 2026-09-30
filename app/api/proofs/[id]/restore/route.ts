import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { proofs, chain } = getServices();
    return NextResponse.json({ proof: toPublicProof(await proofs.restoreOutput(id), chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
