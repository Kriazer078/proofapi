import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { auditHistory } from "@/lib/history-audit";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

async function setup(count: number) {
  let n = 0;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  for (let i = 0; i < count; i++) await service.createProof({ fileName: `c${i}.txt`, bytes: CONTRACT });
  return { repo, chain, service, deps: { repo, chain } };
}
const id = (i: number) => `123e4567-e89b-42d3-a456-42661417400${i}`;

describe("auditHistory", () => {
  it("returns an empty history before the first proof", async () => {
    const { deps } = await setup(0);
    expect(await auditHistory(deps)).toMatchObject({ total: 0, ok: 0, problems: 0, entries: [] });
  });

  it("reports every record intact", async () => {
    const { deps } = await setup(3);
    const audit = await auditHistory(deps);
    expect(audit).toMatchObject({ total: 3, ok: 3, problems: 0 });
    expect(audit.entries.map((e) => e.sequence)).toEqual([0, 1, 2]);
    expect(audit.entries[1]).toMatchObject({ status: "OK", dbId: id(1), fileName: "c1.txt" });
  });

  it("detects a record deleted from the database", async () => {
    const { deps, service } = await setup(3);
    await service.deleteProof(id(1));
    const audit = await auditHistory(deps);
    expect(audit.problems).toBe(1);
    expect(audit.entries[1]).toMatchObject({ status: "MISSING_IN_DATABASE", dbId: null });
  });

  it("detects modified data", async () => {
    const { deps, service } = await setup(2);
    await service.tamperOutput(id(0));
    expect((await auditHistory(deps)).entries[0].status).toBe("DATA_MODIFIED");
  });

  it("detects a broken chain", async () => {
    const { deps, chain } = await setup(2);
    chain.overwriteRecord(1, { prevRecordHash: "11".repeat(32) });
    expect((await auditHistory(deps)).entries[1].status).toBe("CHAIN_BROKEN");
  });

  it("marks hash-only proofs without counting them as problems", async () => {
    const { deps, service } = await setup(0);
    await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    const audit = await auditHistory(deps);
    expect(audit.entries[0].status).toBe("HASH_ONLY");
    expect(audit).toMatchObject({ ok: 1, problems: 0 });
  });

  it("counts proofs still waiting for the chain", async () => {
    const { deps, chain, service } = await setup(1);
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "late.txt", bytes: CONTRACT });
    expect((await auditHistory(deps)).pendingInDatabase).toBe(1);
  });
});
