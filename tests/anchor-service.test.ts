import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { auditHistory } from "@/lib/history-audit";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { verifyProof } from "@/lib/verifier";
import { fakeDevnet } from "./helpers/fake-program";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");
const id = (n: number) => `123e4567-e89b-42d3-a456-42661417400${n}`;

async function setup() {
  const net = await fakeDevnet();
  const chain = new AnchorChainClient({
    rpc: net.rpc,
    programId: net.programId,
    authority: net.authority.publicKey,
    writer: net.writer,
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  });
  let n = 0;
  const repo = new MemoryProofRepo();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => id(n++) });
  return { ...net, chain, repo, service, deps: { repo, chain } };
}

describe("proof services on the Anchor client", () => {
  it("creates and verifies a proof", async () => {
    const { service, deps, chain } = await setup();
    const { proof, chainError } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(chainError).toBeNull();
    expect(proof).toMatchObject({ status: "ANCHORED", sequence: 0, solanaTransaction: "fake-sig-1" });
    const result = await verifyProof(deps, proof.id);
    expect(result.status).toBe("VERIFIED");
    expect(result.checks.issuer.onChain).toBe(chain.issuerAddress());
    expect(result.explorerUrl).toBe("https://explorer.solana.com/tx/fake-sig-1?cluster=devnet");
  });

  it("detects tampering and restores", async () => {
    const { service, deps } = await setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await service.tamperOutput(id(0));
    const failed = await verifyProof(deps, id(0));
    expect(failed.status).toBe("FAILED");
    expect(failed.checks.output.ok).toBe(false);
    expect(failed.checks.input.ok).toBe(true);
    await service.restoreOutput(id(0));
    expect((await verifyProof(deps, id(0))).status).toBe("VERIFIED");
  });

  it("finds a record deleted from the database", async () => {
    const { service, deps } = await setup();
    await service.createProof({ fileName: "a.txt", bytes: CONTRACT });
    await service.createProof({ fileName: "b.txt", bytes: CONTRACT });
    await service.deleteProof(id(0));
    const audit = await auditHistory(deps);
    expect(audit.entries.map((e) => e.status)).toEqual(["MISSING_IN_DATABASE", "OK"]);
  });

  it("keeps the proof pending when Solana fails and anchors it on retry", async () => {
    const { service, rpc } = await setup();
    rpc.failNextSend = new Error("RPC down");
    const first = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(first.proof.status).toBe("PENDING_CHAIN");
    expect(first.chainError).toContain("RPC down");
    const retried = await service.retryAnchoring(id(0));
    expect(retried.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
  });

  it("builds an evidence pack that points at the devnet account", async () => {
    const { service, deps, programId } = await setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const pack = await buildEvidencePack(deps, proof.id);
    expect(pack).toMatchObject({
      cluster: "devnet",
      rpc_url: "https://api.devnet.solana.com",
      program_id: programId.toBase58(),
      proof_account: proof.account,
      sequence: 0,
    });
  });
});
