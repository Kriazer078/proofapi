export type ChainMode = "memory" | "anchor";

export function getChainMode(): ChainMode {
  return process.env.CHAIN_MODE === "anchor" ? "anchor" : "memory";
}
