import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { requireOwner } from "@/lib/request-access";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    await requireOwner(getServices().access, id);
    const { proofs, chain } = getServices();
    return NextResponse.json({ proof: toPublicProof(await proofs.restoreOutput(id), chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
