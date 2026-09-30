import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { loadAnchorConfig } from "../lib/solana/anchor-config";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const connection = new Connection(cfg.rpcUrl, "confirmed");
  const client = new AnchorChainClient({ rpc: new ConnectionRpc(connection), ...cfg });
  const sol = async (k: typeof cfg.authority) => ((await connection.getBalance(k)) / LAMPORTS_PER_SOL).toFixed(4);
  const program = await connection.getAccountInfo(cfg.programId);
  const issuer = await client.readIssuer();
  console.log(`RPC:        ${cfg.rpcUrl} (${cfg.cluster})`);
  console.log(`Program:    ${cfg.programId.toBase58()} ${program?.executable ? "deployed" : "NOT DEPLOYED"}`);
  console.log(`Writer:     ${cfg.writer.publicKey.toBase58()} (${await sol(cfg.writer.publicKey)} SOL)`);
  console.log(`Authority:  ${cfg.authority.toBase58()} (${await sol(cfg.authority)} SOL)`);
  if (!issuer) {
    console.log(`Issuer:     ${client.issuerAddress()} NOT REGISTERED (npm run register-issuer)`);
    return;
  }
  console.log(`Issuer:     ${issuer.address} "${issuer.name}" ${issuer.active ? "active" : "INACTIVE"}`);
  console.log(`Proofs:     ${issuer.proofCount} (last record hash ${issuer.lastRecordHash.slice(0, 16)}…)`);
  console.log(`Writer set: ${issuer.writer === cfg.writer.publicKey.toBase58() ? "matches .env" : `MISMATCH (${issuer.writer})`}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
