import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { admitUpload, currentOwnerHash } from "@/lib/request-access";
import { getServices } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => {
      throw new ValidationError("Send the file as multipart/form-data in a field named file", "bad_request");
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationError("Choose a file to upload", "no_file");
    const field = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" && v.trim() ? v.trim() : undefined;
    };
    const { proofs, chain, access } = getServices();
    const who = await admitUpload(access);
    const { proof, chainError } = await proofs.createProof({
      fileName: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
      agent: {
        agentId: field("agent_id"),
        toolName: field("tool_name"),
        actionType: field("action_type"),
        externalApi: field("external_api"),
        parentProofId: field("parent_proof_id"),
      },
    });
    await access.record({ proofId: proof.id, ...who, createdAt: new Date() });
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    // Lists only the caller's own certificates; anyone else needs the certificate link.
    const { repo, chain, access } = getServices();
    const owner = await currentOwnerHash();
    const mine = new Set(owner ? await access.ownedIds(owner) : []);
    const rows = (await repo.list()).filter((r) => mine.has(r.id));
    return NextResponse.json({ proofs: rows.map((r) => toPublicProof(r, chain)) });
  } catch (e) {
    return errorResponse(e);
  }
}
