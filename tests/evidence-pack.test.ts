import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { ValidationError } from "@/lib/errors";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");
const ID0 = "123e4567-e89b-42d3-a456-426614174000";

async function setup() {
  let n = 0;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  return { repo, chain, service, deps: { repo, chain } };
}

describe("buildEvidencePack", () => {
  it("contains everything needed to verify without our server", async () => {
    const { deps, service, chain } = await setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const pack = await buildEvidencePack(deps, ID0);
    expect(pack).toMatchObject({
      version: "proofapi-evidence-v1",
      cluster: "memory",
      issuer: chain.issuerAddress(),
      proof_account: "memory:0",
      sequence: 0,
      proof_id: ID0,
      salt: proof.salt,
      output_json: proof.outputJson,
      metadata_json: proof.metadataJson,
    });
    expect(Buffer.from(pack.input.content_base64, "base64").equals(CONTRACT)).toBe(true);
    expect(pack.input.file_name).toBe("c.txt");
  });

  it("refuses proofs that are not on chain or have no stored content", async () => {
    const { deps, service, chain } = await setup();
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await expect(buildEvidencePack(deps, ID0)).rejects.toBeInstanceOf(ValidationError);
    const hashOnly = await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    await expect(buildEvidencePack(deps, hashOnly.proof.id)).rejects.toBeInstanceOf(ValidationError);
  });
});
