import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { keypairFromJson, loadAnchorConfig } from "@/lib/solana/anchor-config";

const writer = Keypair.generate();
const files: Record<string, string> = { ".keys/writer.json": JSON.stringify(Array.from(writer.secretKey)) };
const read = (p: string) => {
  if (!(p in files)) throw new Error(`ENOENT: ${p}`);
  return files[p];
};
const base = {
  PROGRAM_ID: Keypair.generate().publicKey.toBase58(),
  AUTHORITY_PUBKEY: Keypair.generate().publicKey.toBase58(),
  WRITER_KEYPAIR_PATH: ".keys/writer.json",
};

describe("loadAnchorConfig", () => {
  it("takes the writer key from WRITER_SECRET_KEY when hosted without key files", () => {
    const { WRITER_KEYPAIR_PATH: _path, ...rest } = base;
    const cfg = loadAnchorConfig({ ...rest, WRITER_SECRET_KEY: files[".keys/writer.json"] }, () => {
      throw new Error("must not read files");
    });
    expect(cfg.writer.publicKey.equals(writer.publicKey)).toBe(true);
  });

  it("loads a complete config with devnet defaults", () => {
    const cfg = loadAnchorConfig(base, read);
    expect(cfg.rpcUrl).toBe("https://api.devnet.solana.com");
    expect(cfg.cluster).toBe("devnet");
    expect(cfg.programId.toBase58()).toBe(base.PROGRAM_ID);
    expect(cfg.authority.toBase58()).toBe(base.AUTHORITY_PUBKEY);
    expect(cfg.writer.publicKey.equals(writer.publicKey)).toBe(true);
  });

  it("names every missing variable", () => {
    expect(() => loadAnchorConfig({ PROGRAM_ID: "" }, read)).toThrow(
      "CHAIN_MODE=anchor needs PROGRAM_ID, AUTHORITY_PUBKEY, WRITER_SECRET_KEY or WRITER_KEYPAIR_PATH in .env",
    );
  });

  it("explains invalid keys and files", () => {
    expect(() => loadAnchorConfig({ ...base, PROGRAM_ID: "nope" }, read)).toThrow("PROGRAM_ID is not a valid Solana address");
    expect(() => loadAnchorConfig({ ...base, WRITER_KEYPAIR_PATH: "missing.json" }, read)).toThrow("Cannot read keypair missing.json");
  });

  it("parses keypair files", () => {
    expect(keypairFromJson(files[".keys/writer.json"], "w").publicKey.equals(writer.publicKey)).toBe(true);
    expect(() => keypairFromJson("[1,2,3]", "w")).toThrow("w is not a Solana keypair file");
  });
});
