export type ProofStatus = "PENDING_CHAIN" | "ANCHORED";
export type ProofMode = "full" | "hashes";

export interface ProofRow {
  id: string;
  mode: ProofMode;
  salt: string | null;
  inputBlob: Buffer | null;
  inputFileName: string | null;
  inputText: string | null;
  outputJson: string | null;
  metadataJson: string | null;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  provider: string | null;
  model: string | null;
  status: ProofStatus;
  sequence: number | null;
  account: string | null;
  solanaTransaction: string | null;
  recordHash: string | null;
  prevRecordHash: string | null;
  chainTimestamp: number | null;
  agentId: string | null;
  toolName: string | null;
  actionType: string | null;
  externalApi: string | null;
  parentProofId: string | null;
  tamperedBackupJson: string | null;
  createdAt: Date;
}

export type ProofPatch = Partial<Omit<ProofRow, "id" | "createdAt">>;

export interface ProofRepo {
  create(row: ProofRow): Promise<void>;
  get(id: string): Promise<ProofRow | null>;
  update(id: string, patch: ProofPatch): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<ProofRow[]>;
}
