import { readFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";

export interface AnchorConfig {
  rpcUrl: string;
  cluster: string;
  programId: PublicKey;
  authority: PublicKey;
  writer: Keypair;
}

type Env = Record<string, string | undefined>;
type ReadFile = (path: string) => string;

export function keypairFromJson(text: string, label: string): Keypair {
  let bytes: unknown;
  try {
    bytes = JSON.parse(text);
  } catch {
    bytes = null;
  }
  if (!Array.isArray(bytes) || bytes.length !== 64) throw new Error(`${label} is not a Solana keypair file (expected a JSON array of 64 numbers)`);
  return Keypair.fromSecretKey(Uint8Array.from(bytes as number[]));
}

function pubkey(env: Env, name: string): PublicKey {
  try {
    return new PublicKey(env[name]!);
  } catch {
    throw new Error(`${name} is not a valid Solana address`);
  }
}

export function loadAnchorConfig(env: Env, read: ReadFile = (p) => readFileSync(p, "utf8")): AnchorConfig {
  const missing = ["PROGRAM_ID", "AUTHORITY_PUBKEY"].filter((k) => !env[k]);
  if (!env.WRITER_SECRET_KEY && !env.WRITER_KEYPAIR_PATH) missing.push("WRITER_SECRET_KEY or WRITER_KEYPAIR_PATH");
  if (missing.length) throw new Error(`CHAIN_MODE=anchor needs ${missing.join(", ")} in .env. Run npm run setup and see programs/proof_registry/README.md.`);
  // Hosted deployments keep the key in a secret environment variable; local setups use the file from npm run setup.
  let text: string;
  let label: string;
  if (env.WRITER_SECRET_KEY) {
    text = env.WRITER_SECRET_KEY;
    label = "WRITER_SECRET_KEY";
  } else {
    label = env.WRITER_KEYPAIR_PATH!;
    try {
      text = read(label);
    } catch {
      throw new Error(`Cannot read keypair ${label}. Run npm run setup.`);
    }
  }
  return {
    rpcUrl: env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    cluster: env.SOLANA_CLUSTER || "devnet",
    programId: pubkey(env, "PROGRAM_ID"),
    authority: pubkey(env, "AUTHORITY_PUBKEY"),
    writer: keypairFromJson(text, label),
  };
}
