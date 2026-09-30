import { saltedHash } from "./hashing";
import type { ProofRow } from "./proof-repo";

export interface ProofHashes {
  input: string;
  output: string;
  metadata: string;
}

/** Hashes recomputed from stored content; hash-only proofs return their stored hashes. */
export function currentHashes(row: ProofRow): ProofHashes {
  if (row.mode === "hashes" || !row.salt || !row.inputBlob || row.outputJson === null || row.metadataJson === null) {
    return { input: row.inputHash, output: row.outputHash, metadata: row.metadataHash };
  }
  return {
    input: saltedHash(row.salt, row.inputBlob),
    output: saltedHash(row.salt, row.outputJson),
    metadata: saltedHash(row.salt, row.metadataJson),
  };
}
