import { readFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { fakeDevnet } from "./helpers/fake-program";

interface Core {
  base58Encode(bytes: Uint8Array): string;
  verifyPack(
    pack: unknown,
    account: { owner: string; data: Uint8Array } | null,
  ): Promise<{ status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN"; checks: { id: string; ok: boolean; detail: string }[] }>;
}

function loadCore(): Core {
  const html = readFileSync("public/verifier.html", "utf8");
  const code = html.slice(html.indexOf("// CORE-START"), html.indexOf("// CORE-END"));
  return new Function(`${code}\nreturn ProofVerifierCore;`)() as Core;
}

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
  const repo = new MemoryProofRepo();
  const service = createProofService({ repo, chain, ai: new MockAIProvider() });
  const { proof } = await service.createProof({ fileName: "c.txt", bytes: Buffer.from("Termination with notice. Payment in 60 days.") });
  const pack = await buildEvidencePack({ repo, chain }, proof.id);
  const raw = await net.rpc.getAccount(new PublicKey(pack.proof_account));
  const account = { owner: raw!.owner.toBase58(), data: new Uint8Array(raw!.data) };
  return { pack, account };
}

describe("verifier.html core", () => {
  const core = loadCore();

  it("encodes base58 like web3.js", () => {
    for (let i = 0; i < 20; i++) {
      const key = Keypair.generate().publicKey;
      expect(core.base58Encode(key.toBytes())).toBe(key.toBase58());
    }
    expect(core.base58Encode(new Uint8Array(32))).toBe(new PublicKey(new Uint8Array(32)).toBase58());
  });

  it("verifies a genuine evidence pack", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack(pack, account);
    expect(result.status).toBe("VERIFIED");
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails an edited output and names the check", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack({ ...pack, output_json: pack.output_json.replace("}", ',"x":1}') }, account);
    expect(result.status).toBe("FAILED");
    expect(result.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["output"]);
  });

  it("fails an account owned by another program", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack(pack, { ...account, owner: Keypair.generate().publicKey.toBase58() });
    expect(result.status).toBe("FAILED");
    expect(result.checks.find((c) => c.id === "owner")!.ok).toBe(false);
  });

  it("reports a missing account and rejects malformed packs", async () => {
    const { pack } = await setup();
    expect((await core.verifyPack(pack, null)).status).toBe("NOT_ON_CHAIN");
    const bad = await core.verifyPack({ version: "other" }, null);
    expect(bad.status).toBe("FAILED");
    expect(bad.checks[0]).toMatchObject({ id: "format", ok: false });
  });
});
