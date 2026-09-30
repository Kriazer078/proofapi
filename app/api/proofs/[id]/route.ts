import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { repo, chain } = getServices();
    const row = await repo.get(id);
    if (!row) throw new NotFoundError("This proof doesn't exist or was deleted");
    return NextResponse.json({ proof: toPublicProof(row, chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
