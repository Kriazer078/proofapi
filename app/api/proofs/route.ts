import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
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
    const { proofs, chain } = getServices();
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
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    const { repo, chain } = getServices();
    const rows = await repo.list();
    return NextResponse.json({ proofs: rows.map((r) => toPublicProof(r, chain)) });
  } catch (e) {
    return errorResponse(e);
  }
}
