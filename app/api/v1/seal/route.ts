import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { admitUpload, resolveCaller } from "@/lib/request-access";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

/**
 * Seal an AI answer produced anywhere: `{ input, output, model?, label? }`.
 * Authenticate with `Authorization: Bearer pk_live_…`; without a key the anonymous demo limits apply.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ValidationError("Send a JSON body with input and output", "bad_request");
    const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);
    const { proofs, access, accounts } = getServices();
    const who = await admitUpload(access, await resolveCaller(accounts));
    const { proof, chainError } = await proofs.createSealProof({ input: str("input") ?? "", output: str("output") ?? "", model: str("model"), label: str("label") });
    await access.record({ proofId: proof.id, ...who, createdAt: new Date() });
    const origin = new URL(req.url).origin;
    return NextResponse.json(
      {
        id: proof.id,
        status: proof.status,
        sequence: proof.sequence,
        certificateUrl: `${origin}/proof/${proof.id}`,
        recordHash: proof.recordHash,
        inputHash: proof.inputHash,
        outputHash: proof.outputHash,
        chainError,
      },
      { status: 201 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
