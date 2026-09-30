import { readFileSync } from "node:fs";
import { Connection } from "@solana/web3.js";
import { keypairFromJson, loadAnchorConfig } from "../lib/solana/anchor-config";
import { setActiveIx } from "../lib/solana/encoding";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const arg = process.argv[2];
  if (arg !== "true" && arg !== "false") throw new Error("Usage: npm run issuer:active -- true|false");
  const cfg = loadAnchorConfig(process.env);
  const path = process.env.AUTHORITY_KEYPAIR_PATH || ".keys/authority.json";
  const authority = keypairFromJson(readFileSync(path, "utf8"), path);
  const rpc = new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed"));
  const signature = await rpc.send(setActiveIx(cfg.programId, authority.publicKey, arg === "true"), [authority]);
  console.log(`Issuer is now ${arg === "true" ? "active" : "inactive"}. Transaction: ${signature}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
