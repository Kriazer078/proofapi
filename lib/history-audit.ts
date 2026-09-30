import { currentHashes } from "./proof-hashes";
import type { ProofRepo, ProofRow } from "./proof-repo";
import { ZERO_HASH, computeRecordHash } from "./solana/record-hash";
import type { ChainClient } from "./solana/types";

export type AuditStatus = "OK" | "HASH_ONLY" | "MISSING_IN_DATABASE" | "DATA_MODIFIED" | "CHAIN_BROKEN";

export interface AuditEntry {
  sequence: number;
  status: AuditStatus;
  proofId: string | null;
  dbId: string | null;
  fileName: string | null;
  timestamp: number | null;
  account: string | null;
}

export interface HistoryAudit {
  issuer: string;
  issuerName: string | null;
  total: number;
  ok: number;
  problems: number;
  pendingInDatabase: number;
  entries: AuditEntry[];
}

function contentMatches(row: ProofRow, record: { inputHash: string; outputHash: string; metadataHash: string }): boolean {
  const now = currentHashes(row);
  return now.input === record.inputHash && now.output === record.outputHash && now.metadata === record.metadataHash;
}

/** Walks the issuer's on-chain history in order and compares every record with the database. */
export async function auditHistory(deps: { repo: ProofRepo; chain: ChainClient }): Promise<HistoryAudit> {
  const issuer = await deps.chain.readIssuer();
  const rows = await deps.repo.list();
  const bySequence = new Map<number, ProofRow>();
  for (const row of rows) if (row.status === "ANCHORED" && row.sequence !== null) bySequence.set(row.sequence, row);
  const pendingInDatabase = rows.filter((r) => r.status === "PENDING_CHAIN").length;

  const entries: AuditEntry[] = [];
  let prevHash = ZERO_HASH;
  for (let seq = 0; seq < (issuer?.proofCount ?? 0); seq++) {
    const record = await deps.chain.readProofBySequence(seq);
    const row = bySequence.get(seq) ?? null;
    const base = { sequence: seq, dbId: row?.id ?? null, fileName: row?.inputFileName ?? null };
    if (!record) {
      entries.push({ ...base, status: "CHAIN_BROKEN", proofId: null, timestamp: null, account: null });
      continue;
    }
    const linked = record.prevRecordHash === prevHash && computeRecordHash(record) === record.recordHash;
    prevHash = record.recordHash;
    let status: AuditStatus;
    if (!linked) status = "CHAIN_BROKEN";
    else if (!row) status = "MISSING_IN_DATABASE";
    else if (row.mode === "hashes") status = "HASH_ONLY";
    else status = contentMatches(row, record) ? "OK" : "DATA_MODIFIED";
    entries.push({ ...base, status, proofId: record.proofId, timestamp: record.timestamp, account: record.account });
  }

  const ok = entries.filter((e) => e.status === "OK" || e.status === "HASH_ONLY").length;
  return {
    issuer: deps.chain.issuerAddress(),
    issuerName: issuer?.name ?? null,
    total: entries.length,
    ok,
    problems: entries.length - ok,
    pendingInDatabase,
    entries,
  };
}
