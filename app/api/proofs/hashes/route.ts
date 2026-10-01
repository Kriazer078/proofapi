import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { admitUpload } from "@/lib/request-access";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ValidationError("Send a JSON body with input_hash, output_hash and metadata_hash");
    const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : "");
    const { proofs, chain, access } = getServices();
    const who = await admitUpload(access);
    const { proof, chainError } = await proofs.createHashOnlyProof({
      inputHash: str("input_hash"),
      outputHash: str("output_hash"),
      metadataHash: str("metadata_hash"),
      agent: { agentId: str("agent_id") || undefined, toolName: str("tool_name") || undefined },
    });
    await access.record({ proofId: proof.id, ...who, createdAt: new Date() });
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
