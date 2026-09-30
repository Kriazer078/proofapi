import { InMemoryChainClient } from "./memory-client";
import type { ChainClient } from "./types";

const g = globalThis as { __proofapiChain?: ChainClient };

/** One chain client per server process; survives dev hot reloads. */
export function getChainClient(): ChainClient {
  if (g.__proofapiChain) return g.__proofapiChain;
  const mode = process.env.CHAIN_MODE ?? "memory";
  if (mode !== "memory") throw new Error(`CHAIN_MODE=${mode} is not available yet (added in Plan B)`);
  g.__proofapiChain = new InMemoryChainClient({ name: process.env.ISSUER_NAME ?? "ProofAPI Demo" });
  return g.__proofapiChain;
}
