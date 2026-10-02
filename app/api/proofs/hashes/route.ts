import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { admitUpload, resolveCaller } from "@/lib/request-access";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ValidationError("Send a JSON body with input_hash, output_hash and metadata_hash");
    // snake_case is the documented form; camelCase matches the SDK and the rest of the API.
    const str = (key: string, alt: string) => {
      const value = body[key] ?? body[alt];
      return typeof value === "string" ? value : "";
    };
    const { proofs, chain, access, accounts } = getServices();
    const who = await admitUpload(access, await resolveCaller(accounts));
    const { proof, chainError } = await proofs.createHashOnlyProof({
      inputHash: str("input_hash", "inputHash"),
      outputHash: str("output_hash", "outputHash"),
      metadataHash: str("metadata_hash", "metadataHash"),
      agent: {
        agentId: str("agent_id", "agentId") || undefined,
        toolName: str("tool_name", "toolName") || undefined,
      },
    });
    await access.record({ proofId: proof.id, ...who, createdAt: new Date() });
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
