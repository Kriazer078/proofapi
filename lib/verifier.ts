import { NotFoundError } from "./errors";
import { currentHashes } from "./proof-hashes";
import type { ProofRepo } from "./proof-repo";
import { ZERO_HASH, computeRecordHash } from "./solana/record-hash";
import type { ChainClient } from "./solana/types";

export interface HashCheck {
  ok: boolean;
  stored: string; // on-chain value
  current: string; // recomputed now
}

export interface VerificationResult {
  status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN";
  checks: {
    input: HashCheck;
    output: HashCheck;
    metadata: HashCheck;
    record: { ok: boolean };
    chain: { ok: boolean; sequence: number };
    issuer: { ok: boolean; expected: string; onChain: string };
  };
  onChainTimestamp: number | null;
  explorerUrl: string | null;
}

export async function verifyProof(deps: { repo: ProofRepo; chain: ChainClient }, id: string): Promise<VerificationResult> {
  const row = await deps.repo.get(id);
  if (!row) throw new NotFoundError(`Proof ${id} not found`);
  const current = currentHashes(row);
  const expectedIssuer = deps.chain.issuerAddress();
  const explorerUrl = row.solanaTransaction ? deps.chain.explorerUrl(row.solanaTransaction) : null;
  const record = row.account ? await deps.chain.readProofAccount(row.account) : null;

  if (!record) {
    const missing = (value: string): HashCheck => ({ ok: false, stored: "", current: value });
    return {
      status: "NOT_ON_CHAIN",
      checks: {
        input: missing(current.input),
        output: missing(current.output),
        metadata: missing(current.metadata),
        record: { ok: false },
        chain: { ok: false, sequence: row.sequence ?? -1 },
        issuer: { ok: false, expected: expectedIssuer, onChain: "" },
      },
      onChainTimestamp: null,
      explorerUrl,
    };
  }

  const check = (stored: string, now: string): HashCheck => ({ ok: stored === now, stored, current: now });
  let chainOk: boolean;
  if (record.sequence === 0) {
    chainOk = record.prevRecordHash === ZERO_HASH;
  } else {
    const prev = await deps.chain.readProofBySequence(record.sequence - 1);
    chainOk = prev !== null && prev.recordHash === record.prevRecordHash;
  }

  const checks: VerificationResult["checks"] = {
    input: check(record.inputHash, current.input),
    output: check(record.outputHash, current.output),
    metadata: check(record.metadataHash, current.metadata),
    record: { ok: computeRecordHash(record) === record.recordHash },
    chain: { ok: chainOk, sequence: record.sequence },
    issuer: { ok: record.issuer === expectedIssuer, expected: expectedIssuer, onChain: record.issuer },
  };
  const allOk = Object.values(checks).every((c) => c.ok);
  return { status: allOk ? "VERIFIED" : "FAILED", checks, onChainTimestamp: record.timestamp, explorerUrl };
}
