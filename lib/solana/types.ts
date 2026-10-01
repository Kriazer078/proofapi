export interface IssuerState {
  address: string;
  writer: string;
  name: string;
  active: boolean;
  proofCount: number;
  lastRecordHash: string;
  createdAt: number;
}

export interface ChainProofRecord {
  account: string;
  issuer: string;
  sequence: number;
  proofId: string;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  prevRecordHash: string;
  recordHash: string;
  timestamp: number;
}

export interface AnchorInput {
  proofId: string;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
}

export interface AnchorResult {
  signature: string;
  account: string;
  sequence: number;
  recordHash: string;
  prevRecordHash: string;
  timestamp: number;
}

export interface EvidenceContext {
  cluster: string;
  rpcUrl: string | null;
  programId: string | null;
}

/** One client is bound to our issuer. Plan B adds the real Solana implementation. */
export interface ChainClient {
  readonly mode: "memory" | "anchor";
  issuerAddress(): string;
  ensureIssuer(): Promise<IssuerState>;
  readIssuer(): Promise<IssuerState | null>;
  anchorProof(p: AnchorInput): Promise<AnchorResult>;
  readProofBySequence(sequence: number): Promise<ChainProofRecord | null>;
  /** Records start … start+count-1 in order, null where missing. Batched so long histories stay fast. */
  readProofRange(start: number, count: number): Promise<(ChainProofRecord | null)[]>;
  readProofAccount(account: string): Promise<ChainProofRecord | null>;
  explorerUrl(signature: string): string | null;
  accountUrl(account: string): string | null;
  evidenceContext(): EvidenceContext;
}
