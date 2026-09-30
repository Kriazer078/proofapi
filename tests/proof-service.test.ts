import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { saltedHash } from "@/lib/hashing";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const SALT = "5a".repeat(32);
const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

function setup() {
  let n = 0;
  let t = 1790000000;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient({ clock: () => t++ });
  const service = createProofService({
    repo,
    chain,
    ai: new MockAIProvider(),
    now: () => new Date("2026-09-30T12:00:00.000Z"),
    newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}`,
    newSalt: () => SALT,
  });
  return { repo, chain, service };
}
const ID0 = "123e4567-e89b-42d3-a456-426614174000";
const ID1 = "123e4567-e89b-42d3-a456-426614174001";

describe("createProof", () => {
  it("analyzes, salts, hashes and anchors a document", async () => {
    const { chain, service } = setup();
    const { proof, chainError } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(chainError).toBeNull();
    expect(proof).toMatchObject({ id: ID0, mode: "full", status: "ANCHORED", sequence: 0, salt: SALT });
    expect(proof.inputHash).toBe(saltedHash(SALT, CONTRACT));
    expect(proof.outputHash).toBe(saltedHash(SALT, proof.outputJson!));
    expect(proof.metadataHash).toBe(saltedHash(SALT, proof.metadataJson!));
    expect(JSON.parse(proof.metadataJson!)).toEqual({
      created_at: "2026-09-30T12:00:00.000Z",
      file_name: "c.txt",
      model: "proofapi-mock-v1",
      model_attestation: "declared",
      provider: "mock",
    });
    expect(await chain.readProofBySequence(0)).toMatchObject({ proofId: ID0, inputHash: proof.inputHash });
  });

  it("links consecutive proofs in the issuer history", async () => {
    const { service } = setup();
    const a = await service.createProof({ fileName: "a.txt", bytes: CONTRACT });
    const b = await service.createProof({ fileName: "b.txt", bytes: CONTRACT });
    expect(b.proof.sequence).toBe(1);
    expect(b.proof.prevRecordHash).toBe(a.proof.recordHash);
  });

  it("stores agent fields in metadata", async () => {
    const { service } = setup();
    const { proof } = await service.createProof({
      fileName: "c.txt",
      bytes: CONTRACT,
      agent: { agentId: "agent-7", toolName: "crm.update", actionType: "update", externalApi: "https://api.example.com", parentProofId: ID1 },
    });
    expect(JSON.parse(proof.metadataJson!)).toMatchObject({
      agent_id: "agent-7",
      tool_name: "crm.update",
      action_type: "update",
      external_api: "https://api.example.com",
      parent_proof_id: ID1,
    });
    expect(proof.agentId).toBe("agent-7");
  });
});

describe("anchoring failures", () => {
  it("keeps the proof pending and retries later", async () => {
    const { chain, service } = setup();
    chain.failNextAnchor = new Error("RPC down");
    const first = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(first.chainError).toBe("RPC down");
    expect(first.proof.status).toBe("PENDING_CHAIN");
    const second = await service.retryAnchoring(ID0);
    expect(second.chainError).toBeNull();
    expect(second.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
  });

  it("adopts a record that reached the chain even if the response was lost", async () => {
    const { repo, chain, service } = setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await repo.update(ID0, { status: "PENDING_CHAIN", sequence: null, account: null, recordHash: null });
    const retried = await service.retryAnchoring(ID0);
    expect(retried.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
    expect((await chain.readIssuer())!.proofCount).toBe(1);
  });
});

describe("createHashOnlyProof", () => {
  it("anchors caller-supplied hashes without storing content", async () => {
    const { service } = setup();
    const { proof } = await service.createHashOnlyProof({ inputHash: "AA".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    expect(proof).toMatchObject({ mode: "hashes", status: "ANCHORED", salt: null, inputBlob: null, inputHash: "aa".repeat(32) });
  });
  it("rejects malformed hashes", async () => {
    const { service } = setup();
    await expect(service.createHashOnlyProof({ inputHash: "x", outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("demo actions", () => {
  it("tampers with and restores the AI output", async () => {
    const { service } = setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const tampered = await service.tamperOutput(ID0);
    expect(JSON.parse(tampered.outputJson!).riskScore).toBe(5);
    expect(tampered.tamperedBackupJson).toBe(proof.outputJson);
    const restored = await service.restoreOutput(ID0);
    expect(restored.outputJson).toBe(proof.outputJson);
    expect(restored.tamperedBackupJson).toBeNull();
  });
  it("deletes a proof from the database and reports its sequence", async () => {
    const { repo, service } = setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(await service.deleteProof(ID0)).toEqual({ sequence: 0 });
    expect(await repo.get(ID0)).toBeNull();
  });
  it("throws NotFoundError for unknown ids", async () => {
    const { service } = setup();
    await expect(service.retryAnchoring("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
