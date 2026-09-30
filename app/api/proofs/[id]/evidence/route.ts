import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { getServices } from "@/lib/services";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const pack = await buildEvidencePack(getServices().deps, id);
    return new NextResponse(JSON.stringify(pack, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="proofapi-evidence-${pack.sequence}.json"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
