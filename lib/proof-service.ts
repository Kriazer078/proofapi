import { randomUUID } from "node:crypto";
import type { AIProvider, AnalysisResult } from "./ai-provider";
import { NotFoundError, ValidationError } from "./errors";
import { extractText } from "./extract-text";
import { canonicalJson, newSalt, saltedHash } from "./hashing";
import type { ProofRepo, ProofRow } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface AgentFields {
  agentId?: string;
  toolName?: string;
  actionType?: string;
  externalApi?: string;
  parentProofId?: string;
}

export interface ProofServiceDeps {
  repo: ProofRepo;
  chain: ChainClient;
  ai: AIProvider;
  now?: () => Date;
  newId?: () => string;
  newSalt?: () => string;
}

export interface ProofOutcome {
  proof: ProofRow;
  chainError: string | null;
}

const HEX64 = /^[0-9a-f]{64}$/;
const RETRY_LOOKBACK = 20;

function emptyRow(id: string, createdAt: Date): Omit<ProofRow, "mode" | "inputHash" | "outputHash" | "metadataHash"> {
  return {
    id,
    salt: null,
    inputBlob: null,
    inputFileName: null,
    inputText: null,
    outputJson: null,
    metadataJson: null,
    provider: null,
    model: null,
    status: "PENDING_CHAIN",
    sequence: null,
    account: null,
    solanaTransaction: null,
    recordHash: null,
    prevRecordHash: null,
    chainTimestamp: null,
    agentId: null,
    toolName: null,
    actionType: null,
    externalApi: null,
    parentProofId: null,
    tamperedBackupJson: null,
    createdAt,
  };
}

function agentColumns(agent: AgentFields) {
  return {
    agentId: agent.agentId ?? null,
    toolName: agent.toolName ?? null,
    actionType: agent.actionType ?? null,
    externalApi: agent.externalApi ?? null,
    parentProofId: agent.parentProofId ?? null,
  };
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function createProofService(deps: ProofServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const makeSalt = deps.newSalt ?? newSalt;

  async function load(id: string): Promise<ProofRow> {
    const row = await deps.repo.get(id);
    if (!row) throw new NotFoundError(`Proof ${id} not found`);
    return row;
  }

  async function markAnchored(id: string, r: { signature: string | null; account: string; sequence: number; recordHash: string; prevRecordHash: string; timestamp: number }) {
    await deps.repo.update(id, {
      status: "ANCHORED",
      solanaTransaction: r.signature,
      account: r.account,
      sequence: r.sequence,
      recordHash: r.recordHash,
      prevRecordHash: r.prevRecordHash,
      chainTimestamp: r.timestamp,
    });
  }

  async function anchor(row: ProofRow): Promise<ProofOutcome> {
    try {
      const r = await deps.chain.anchorProof({
        proofId: row.id,
        inputHash: row.inputHash,
        outputHash: row.outputHash,
        metadataHash: row.metadataHash,
      });
      await markAnchored(row.id, r);
      return { proof: await load(row.id), chainError: null };
    } catch (e) {
      return { proof: await load(row.id), chainError: message(e) };
    }
  }

  /** A confirmed transaction can lose its response; look for our proof near the chain tip before writing again. */
  async function findOnChain(proofId: string) {
    const issuer = await deps.chain.readIssuer();
    if (!issuer) return null;
    for (let seq = issuer.proofCount - 1; seq >= Math.max(0, issuer.proofCount - RETRY_LOOKBACK); seq--) {
      const record = await deps.chain.readProofBySequence(seq);
      if (record?.proofId === proofId) return record;
    }
    return null;
  }

  function requireFull(row: ProofRow): asserts row is ProofRow & { outputJson: string } {
    if (row.mode !== "full" || row.outputJson === null) throw new ValidationError("This action needs a proof with stored content");
  }

  return {
    async createProof(input: { fileName: string; bytes: Buffer; agent?: AgentFields }): Promise<ProofOutcome> {
      const agent = input.agent ?? {};
      const text = await extractText(input.fileName, input.bytes);
      const analysis: AnalysisResult = await deps.ai.analyze(text);
      const createdAt = now();
      const salt = makeSalt();
      const metadata: Record<string, string> = {
        provider: deps.ai.name,
        model: deps.ai.model,
        model_attestation: "declared",
        created_at: createdAt.toISOString(),
        file_name: input.fileName,
      };
      if (agent.agentId) metadata.agent_id = agent.agentId;
      if (agent.toolName) metadata.tool_name = agent.toolName;
      if (agent.actionType) metadata.action_type = agent.actionType;
      if (agent.externalApi) metadata.external_api = agent.externalApi;
      if (agent.parentProofId) metadata.parent_proof_id = agent.parentProofId;
      const outputJson = canonicalJson(analysis);
      const metadataJson = canonicalJson(metadata);
      const row: ProofRow = {
        ...emptyRow(newId(), createdAt),
        ...agentColumns(agent),
        mode: "full",
        salt,
        inputBlob: input.bytes,
        inputFileName: input.fileName,
        inputText: text,
        outputJson,
        metadataJson,
        inputHash: saltedHash(salt, input.bytes),
        outputHash: saltedHash(salt, outputJson),
        metadataHash: saltedHash(salt, metadataJson),
        provider: deps.ai.name,
        model: deps.ai.model,
      };
      await deps.repo.create(row);
      return anchor(row);
    },

    async createHashOnlyProof(input: { inputHash: string; outputHash: string; metadataHash: string; agent?: AgentFields }): Promise<ProofOutcome> {
      const hashes = { inputHash: input.inputHash, outputHash: input.outputHash, metadataHash: input.metadataHash };
      for (const [name, value] of Object.entries(hashes)) {
        if (typeof value !== "string" || !HEX64.test(value.toLowerCase())) {
          throw new ValidationError(`${name} must be 64 hex characters`);
        }
      }
      const row: ProofRow = {
        ...emptyRow(newId(), now()),
        ...agentColumns(input.agent ?? {}),
        mode: "hashes",
        inputHash: input.inputHash.toLowerCase(),
        outputHash: input.outputHash.toLowerCase(),
        metadataHash: input.metadataHash.toLowerCase(),
      };
      await deps.repo.create(row);
      return anchor(row);
    },

    async retryAnchoring(id: string): Promise<ProofOutcome> {
      const row = await load(id);
      if (row.status === "ANCHORED") return { proof: row, chainError: null };
      const existing = await findOnChain(row.id);
      if (existing) {
        await markAnchored(row.id, { ...existing, signature: null });
        return { proof: await load(row.id), chainError: null };
      }
      return anchor(row);
    },

    async tamperOutput(id: string): Promise<ProofRow> {
      const row = await load(id);
      requireFull(row);
      if (row.tamperedBackupJson) return row;
      const original = JSON.parse(row.outputJson) as AnalysisResult;
      const forged = canonicalJson({ ...original, riskScore: 5, issues: [], summary: "No notable risk factors found." });
      await deps.repo.update(id, { outputJson: forged, tamperedBackupJson: row.outputJson });
      return load(id);
    },

    async restoreOutput(id: string): Promise<ProofRow> {
      const row = await load(id);
      if (!row.tamperedBackupJson) return row;
      await deps.repo.update(id, { outputJson: row.tamperedBackupJson, tamperedBackupJson: null });
      return load(id);
    },

    async deleteProof(id: string): Promise<{ sequence: number | null }> {
      const row = await load(id);
      await deps.repo.delete(id);
      return { sequence: row.sequence };
    },
  };
}

export type ProofService = ReturnType<typeof createProofService>;
