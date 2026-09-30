import { describe, expect, it } from "vitest";
import { ChainError } from "@/lib/errors";
import { InMemoryChainClient } from "@/lib/solana/memory-client";
import { ZERO_HASH, computeRecordHash } from "@/lib/solana/record-hash";

const input = (n: number) => ({
  proofId: `123e4567-e89b-42d3-a456-42661417400${n}`,
  inputHash: "aa".repeat(32),
  outputHash: "bb".repeat(32),
  metadataHash: "cc".repeat(32),
});

function newChain() {
  let t = 1790000000;
  return new InMemoryChainClient({ name: "Test", clock: () => t++ });
}

describe("InMemoryChainClient", () => {
  it("registers the issuer once", async () => {
    const chain = newChain();
    const a = await chain.ensureIssuer();
    const b = await chain.ensureIssuer();
    expect(a).toEqual(b);
    expect(a).toMatchObject({ name: "Test", active: true, proofCount: 0, lastRecordHash: ZERO_HASH });
  });

  it("numbers records and links them into a hash chain", async () => {
    const chain = newChain();
    const first = await chain.anchorProof(input(1));
    const second = await chain.anchorProof(input(2));
    expect(first.sequence).toBe(0);
    expect(first.prevRecordHash).toBe(ZERO_HASH);
    expect(second.sequence).toBe(1);
    expect(second.prevRecordHash).toBe(first.recordHash);
    const issuer = await chain.readIssuer();
    expect(issuer).toMatchObject({ proofCount: 2, lastRecordHash: second.recordHash });
  });

  it("computes record hashes with the shared formula", async () => {
    const chain = newChain();
    const r = await chain.anchorProof(input(1));
    const record = await chain.readProofAccount(r.account);
    expect(record).not.toBeNull();
    expect(computeRecordHash(record!)).toBe(r.recordHash);
    expect(await chain.readProofBySequence(0)).toEqual(record);
  });

  it("refuses writes from an inactive issuer", async () => {
    const chain = newChain();
    await chain.ensureIssuer();
    chain.setActive(false);
    await expect(chain.anchorProof(input(1))).rejects.toBeInstanceOf(ChainError);
  });

  it("can simulate one network failure", async () => {
    const chain = newChain();
    chain.failNextAnchor = new Error("RPC down");
    await expect(chain.anchorProof(input(1))).rejects.toThrow("RPC down");
    await expect(chain.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
  });

  it("returns null for unknown records and has no explorer links", async () => {
    const chain = newChain();
    expect(await chain.readProofBySequence(0)).toBeNull();
    expect(await chain.readProofAccount("memory:9")).toBeNull();
    expect(chain.explorerUrl("sig")).toBeNull();
  });
});
