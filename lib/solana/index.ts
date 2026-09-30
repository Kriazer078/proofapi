import { Connection } from "@solana/web3.js";
import { AnchorChainClient } from "./anchor-client";
import { loadAnchorConfig } from "./anchor-config";
import { InMemoryChainClient } from "./memory-client";
import { ConnectionRpc } from "./rpc";
import type { ChainClient } from "./types";

const g = globalThis as { __proofapiChain?: ChainClient };

/** One chain client per server process; survives dev hot reloads. */
export function getChainClient(): ChainClient {
  if (g.__proofapiChain) return g.__proofapiChain;
  const mode = process.env.CHAIN_MODE ?? "memory";
  if (mode === "anchor") {
    const cfg = loadAnchorConfig(process.env);
    g.__proofapiChain = new AnchorChainClient({ rpc: new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed")), ...cfg });
  } else if (mode === "memory") {
    g.__proofapiChain = new InMemoryChainClient({ name: process.env.ISSUER_NAME ?? "ProofAPI Demo" });
  } else {
    throw new Error(`Unknown CHAIN_MODE=${mode}. Use memory or anchor.`);
  }
  return g.__proofapiChain;
}
