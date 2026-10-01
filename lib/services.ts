import { PrismaAccessStore } from "./access";
import { MockAIProvider } from "./ai-provider";
import { prisma } from "./db";
import { createProofService } from "./proof-service";
import { PrismaProofRepo } from "./proof-repo-prisma";
import { getChainClient } from "./solana";

export function getServices() {
  const repo = new PrismaProofRepo(prisma);
  const chain = getChainClient();
  const proofs = createProofService({ repo, chain, ai: new MockAIProvider() });
  return { repo, chain, proofs, access: new PrismaAccessStore(prisma), deps: { repo, chain } };
}
