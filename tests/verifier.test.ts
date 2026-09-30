import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { NotFoundError } from "@/lib/errors";
import { canonicalJson } from "@/lib/hashing";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";
import { verifyProof } from "@/lib/verifier";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

async function setup(count = 1) {
  let n = 0;
  let t = 1790000000;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient({ clock: () => t++ });
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  for (let i = 0; i < count; i++) await service.createProof({ fileName: `c${i}.txt`, bytes: CONTRACT });
  return { repo, chain, service, deps: { repo, chain } };
}
const ID0 = "123e4567-e89b-42d3-a456-426614174000";
const ID1 = "123e4567-e89b-42d3-a456-426614174001";

describe("verifyProof", () => {
  it("verifies an untouched proof", async () => {
    const { deps } = await setup();
    const r = await verifyProof(deps, ID0);
    expect(r.status).toBe("VERIFIED");
    expect(Object.values(r.checks).every((c) => c.ok)).toBe(true);
    expect(r.checks.chain.sequence).toBe(0);
    expect(r.onChainTimestamp).toBe(1790000001); // tick 0 registers the issuer
  });

  it("fails on output when the AI response is modified", async () => {
    const { deps, service } = await setup();
    await service.tamperOutput(ID0);
    const r = await verifyProof(deps, ID0);
    expect(r.status).toBe("FAILED");
    expect(r.checks.output.ok).toBe(false);
    expect(r.checks.output.stored).not.toBe(r.checks.output.current);
    expect(r.checks.input.ok && r.checks.metadata.ok).toBe(true);
  });

  it("fails on input when the document is modified", async () => {
    const { deps, repo } = await setup();
    await repo.update(ID0, { inputBlob: Buffer.from("A different contract") });
    expect((await verifyProof(deps, ID0)).checks.input.ok).toBe(false);
  });

  it("fails on metadata when the declared model is changed", async () => {
    const { deps, repo } = await setup();
    const row = (await repo.get(ID0))!;
    await repo.update(ID0, { metadataJson: canonicalJson({ ...JSON.parse(row.metadataJson!), model: "gpt-9" }) });
    expect((await verifyProof(deps, ID0)).checks.metadata.ok).toBe(false);
  });

  it("ignores hash columns edited in the database", async () => {
    const { deps, repo } = await setup();
    await repo.update(ID0, { outputJson: '{"riskScore":5}', outputHash: "00".repeat(32) });
    expect((await verifyProof(deps, ID0)).checks.output.ok).toBe(false);
  });

  it("fails the chain check when the previous record was altered", async () => {
    const { deps, chain } = await setup(2);
    chain.overwriteRecord(0, { recordHash: "11".repeat(32) });
    const r = await verifyProof(deps, ID1);
    expect(r.status).toBe("FAILED");
    expect(r.checks.chain.ok).toBe(false);
    expect(r.checks.record.ok).toBe(true);
  });

  it("fails the record check when on-chain fields do not match the record hash", async () => {
    const { deps, chain } = await setup();
    chain.overwriteRecord(0, { timestamp: 1 });
    expect((await verifyProof(deps, ID0)).checks.record.ok).toBe(false);
  });

  it("reports NOT_ON_CHAIN when anchoring never happened", async () => {
    const { deps, chain, service } = await setup(0);
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect((await verifyProof(deps, ID0)).status).toBe("NOT_ON_CHAIN");
  });

  it("verifies hash-only proofs against their stored hashes", async () => {
    const { deps, service } = await setup(0);
    await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    expect((await verifyProof(deps, ID0)).status).toBe("VERIFIED");
  });

  it("throws NotFoundError for unknown proofs", async () => {
    const { deps } = await setup(0);
    await expect(verifyProof(deps, "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
