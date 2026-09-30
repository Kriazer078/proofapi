import { readFileSync } from "node:fs";
import { Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { keypairFromJson, loadAnchorConfig } from "../lib/solana/anchor-config";
import { registerIssuerIx } from "../lib/solana/encoding";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const authorityPath = process.env.AUTHORITY_KEYPAIR_PATH || ".keys/authority.json";
  const authority = keypairFromJson(readFileSync(authorityPath, "utf8"), authorityPath);
  if (!authority.publicKey.equals(cfg.authority)) throw new Error(`${authorityPath} does not match AUTHORITY_PUBKEY in .env`);

  const connection = new Connection(cfg.rpcUrl, "confirmed");
  const rpc = new ConnectionRpc(connection);
  const client = new AnchorChainClient({ rpc, ...cfg });

  const program = await connection.getAccountInfo(cfg.programId);
  if (!program?.executable) throw new Error(`No deployed program at ${cfg.programId.toBase58()}. Deploy it first (programs/proof_registry/README.md).`);

  const existing = await client.readIssuer();
  if (existing) {
    console.log(`Issuer already registered: ${client.issuerAddress()} ("${existing.name}", ${existing.proofCount} proofs)`);
    return;
  }

  const min = 0.01 * LAMPORTS_PER_SOL;
  if ((await connection.getBalance(authority.publicKey)) < min) {
    const writerBalance = await connection.getBalance(cfg.writer.publicKey);
    if (writerBalance < 0.05 * LAMPORTS_PER_SOL) {
      throw new Error(`The writer ${cfg.writer.publicKey.toBase58()} has no SOL. Get devnet SOL at https://faucet.solana.com and run again.`);
    }
    console.log("Moving 0.02 SOL from the writer to the authority to pay for registration...");
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: cfg.writer.publicKey, toPubkey: authority.publicKey, lamports: 0.02 * LAMPORTS_PER_SOL }),
    );
    await sendAndConfirmTransaction(connection, tx, [cfg.writer], { commitment: "confirmed" });
  }

  const name = process.env.ISSUER_NAME || "ProofAPI Demo";
  const signature = await rpc.send(registerIssuerIx(cfg.programId, authority.publicKey, cfg.writer.publicKey, name), [authority]);
  console.log(`Registered issuer "${name}" at ${client.issuerAddress()}`);
  console.log(client.explorerUrl(signature));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
