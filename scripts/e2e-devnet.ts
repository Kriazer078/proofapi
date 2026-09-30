import { readFileSync, writeFileSync } from "node:fs";
import { Connection } from "@solana/web3.js";
import { MockAIProvider } from "../lib/ai-provider";
import { buildEvidencePack } from "../lib/evidence-pack";
import { auditHistory } from "../lib/history-audit";
import { createProofService } from "../lib/proof-service";
import { MemoryProofRepo } from "../lib/proof-repo-memory";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { loadAnchorConfig } from "../lib/solana/anchor-config";
import { ConnectionRpc } from "../lib/solana/rpc";
import { verifyProof } from "../lib/verifier";

process.loadEnvFile(".env");

function step(ok: boolean, text: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${text}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const chain = new AnchorChainClient({ rpc: new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed")), ...cfg });
  const repo = new MemoryProofRepo();
  const deps = { repo, chain };
  const service = createProofService({ repo, chain, ai: new MockAIProvider() });

  const { proof, chainError } = await service.createProof({
    fileName: "sample-contract.txt",
    bytes: readFileSync("public/sample-contract.txt"),
  });
  step(proof.status === "ANCHORED", `recorded proof #${proof.sequence} ${chainError ?? ""}`);
  console.log(`      ${chain.explorerUrl(proof.solanaTransaction!)}`);

  step((await verifyProof(deps, proof.id)).status === "VERIFIED", "verifies against Solana");

  await service.tamperOutput(proof.id);
  const tampered = await verifyProof(deps, proof.id);
  step(tampered.status === "FAILED" && !tampered.checks.output.ok, "detects an edited AI output");
  await service.restoreOutput(proof.id);

  const pack = await buildEvidencePack(deps, proof.id);
  const file = `evidence-${proof.sequence}.json`;
  writeFileSync(file, JSON.stringify(pack, null, 2));
  step(true, `wrote ${file} for public/verifier.html`);

  const audit = await auditHistory(deps);
  const mine = audit.entries.find((e) => e.sequence === proof.sequence);
  step(mine?.status === "OK", `history audit: ${audit.total} records on Solana, this one OK`);
  console.log("      Earlier records show MISSING_IN_DATABASE here because this script uses a fresh in-memory database.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
