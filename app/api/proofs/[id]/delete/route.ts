import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { requireOwner } from "@/lib/request-access";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    await requireOwner(getServices().access, id);
    return NextResponse.json(await getServices().proofs.deleteProof(id));
  } catch (e) {
    return errorResponse(e);
  }
}
