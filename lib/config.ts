export type ChainMode = "memory" | "anchor";

/** Which AI reviews documents, for honest copy in the interface. */
export function getAIProviderName(): "gemini" | "mock" {
  return process.env.GEMINI_API_KEY && process.env.AI_PROVIDER !== "mock" ? "gemini" : "mock";
}

export function getChainMode(): ChainMode {
  return process.env.CHAIN_MODE === "anchor" ? "anchor" : "memory";
}
