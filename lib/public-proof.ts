import type { AnalysisResult } from "./ai-provider";
import type { ProofMode, ProofRow, ProofStatus } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface PublicProof {
  id: string;
  mode: ProofMode;
  status: ProofStatus;
  sequence: number | null;
  account: string | null;
  inputFileName: string | null;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  recordHash: string | null;
  provider: string | null;
  model: string | null;
  output: AnalysisResult | { answer: string } | null;
  metadata: Record<string, unknown> | null;
  isTampered: boolean;
  createdAt: string;
  chainTimestamp: number | null;
  explorerUrl: string | null;
  accountUrl: string | null;
  agentId: string | null;
}

export function toPublicProof(row: ProofRow, chain: ChainClient): PublicProof {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    sequence: row.sequence,
    account: row.account,
    inputFileName: row.inputFileName,
    inputHash: row.inputHash,
    outputHash: row.outputHash,
    metadataHash: row.metadataHash,
    recordHash: row.recordHash,
    provider: row.provider,
    model: row.model,
    output: row.outputJson ? (JSON.parse(row.outputJson) as PublicProof["output"]) : null,
    metadata: row.metadataJson ? (JSON.parse(row.metadataJson) as Record<string, unknown>) : null,
    isTampered: row.tamperedBackupJson !== null,
    createdAt: row.createdAt.toISOString(),
    chainTimestamp: row.chainTimestamp,
    explorerUrl: row.solanaTransaction ? chain.explorerUrl(row.solanaTransaction) : null,
    accountUrl: row.account ? chain.accountUrl(row.account) : null,
    agentId: row.agentId,
  };
}
