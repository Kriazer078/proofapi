import { PrismaAccessStore } from "./access";
import { type AccountStore, PrismaAccountStore } from "./accounts";
import type { AIProvider } from "./ai-provider";
import { createAIProvider } from "./ai-gemini";
import { type DemoRequestStore, PrismaDemoRequestStore } from "./demo-requests";
import { prisma } from "./db";
import { createProofService } from "./proof-service";
import { PrismaProofRepo } from "./proof-repo-prisma";
import { getChainClient } from "./solana";

const g = globalThis as { __proofapiAI?: AIProvider };

/** One AI provider per server process, so its small answer cache survives between requests. */
export function getAI(): AIProvider {
  g.__proofapiAI ??= createAIProvider(process.env);
  return g.__proofapiAI;
}

/** Users and API keys. */
export function getAccounts(): AccountStore {
  return new PrismaAccountStore(prisma);
}

/** Demo requests sent from the website form. */
export function getDemoRequests(): DemoRequestStore {
  return new PrismaDemoRequestStore(prisma);
}

export function getServices() {
  const repo = new PrismaProofRepo(prisma);
  const chain = getChainClient();
  const proofs = createProofService({ repo, chain, ai: getAI() });
  return { repo, chain, proofs, access: new PrismaAccessStore(prisma),
    accounts: getAccounts(), deps: { repo, chain } };
}
