import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { keypairFromJson } from "../lib/solana/anchor-config";
import { upsertEnv } from "./lib/env-file";

function loadOrCreate(path: string): { key: Keypair; created: boolean } {
  if (existsSync(path)) return { key: keypairFromJson(readFileSync(path, "utf8"), path), created: false };
  const key = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(key.secretKey)), { mode: 0o600 });
  return { key, created: true };
}

mkdirSync(".keys", { recursive: true });
const authority = loadOrCreate(".keys/authority.json");
const writer = loadOrCreate(".keys/writer.json");

const envText = existsSync(".env") ? readFileSync(".env", "utf8") : readFileSync(".env.example", "utf8");
writeFileSync(
  ".env",
  upsertEnv(
    envText,
    {
      AUTHORITY_PUBKEY: authority.key.publicKey.toBase58(),
      AUTHORITY_KEYPAIR_PATH: ".keys/authority.json",
      WRITER_KEYPAIR_PATH: ".keys/writer.json",
    },
    { SOLANA_RPC_URL: "https://api.devnet.solana.com", SOLANA_CLUSTER: "devnet" },
  ),
);

console.log(`Writer    (signs and pays for proofs): ${writer.key.publicKey.toBase58()}${writer.created ? "  [new]" : ""}`);
console.log(`Authority (manages the issuer):        ${authority.key.publicKey.toBase58()}${authority.created ? "  [new]" : ""}`);
console.log("\nKeys are in .keys/ (git-ignored). Never share these files.");
console.log("Next:");
console.log("  1. Get devnet SOL for the WRITER address at https://faucet.solana.com");
console.log("  2. Deploy the program: programs/proof_registry/README.md, then put PROGRAM_ID in .env");
console.log("  3. npm run register-issuer");
