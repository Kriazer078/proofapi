import { NotFoundError, ValidationError } from "./errors";
import type { ProofRepo } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface EvidencePack {
  version: "proofapi-evidence-v1";
  cluster: string;
  rpc_url: string | null;
  program_id: string | null;
  issuer: string;
  proof_account: string;
  sequence: number;
  proof_id: string;
  salt: string;
  input: { file_name: string; content_base64: string };
  output_json: string;
  metadata_json: string;
}

export async function buildEvidencePack(deps: { repo: ProofRepo; chain: ChainClient }, id: string): Promise<EvidencePack> {
  const row = await deps.repo.get(id);
  if (!row) throw new NotFoundError(`Proof ${id} not found`);
  if (row.mode !== "full" || !row.salt || !row.inputBlob || row.outputJson === null || row.metadataJson === null) {
    throw new ValidationError("Evidence packs are available only for proofs with stored content");
  }
  if (row.status !== "ANCHORED" || row.account === null || row.sequence === null) {
    throw new ValidationError("This proof is not on Solana yet");
  }
  const ctx = deps.chain.evidenceContext();
  return {
    version: "proofapi-evidence-v1",
    cluster: ctx.cluster,
    rpc_url: ctx.rpcUrl,
    program_id: ctx.programId,
    issuer: deps.chain.issuerAddress(),
    proof_account: row.account,
    sequence: row.sequence,
    proof_id: row.id,
    salt: row.salt,
    input: { file_name: row.inputFileName ?? "input", content_base64: row.inputBlob.toString("base64") },
    output_json: row.outputJson,
    metadata_json: row.metadataJson,
  };
}
