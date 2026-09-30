import { Keypair } from "@solana/web3.js";
import { ChainError } from "../errors";
import { ZERO_HASH, computeRecordHash } from "./record-hash";
import type { AnchorInput, AnchorResult, ChainClient, ChainProofRecord, EvidenceContext, IssuerState } from "./types";

interface Options {
  name?: string;
  issuerAddress?: string;
  writer?: string;
  clock?: () => number;
}

/** Same rules as the Solana program (spec v2 §4), kept in process memory. */
export class InMemoryChainClient implements ChainClient {
  readonly mode = "memory" as const;
  failNextAnchor: Error | null = null;

  private readonly address: string;
  private readonly writer: string;
  private readonly name: string;
  private readonly clock: () => number;
  private issuer: IssuerState | null = null;
  private records: ChainProofRecord[] = [];

  constructor(opts: Options = {}) {
    this.address = opts.issuerAddress ?? Keypair.generate().publicKey.toBase58();
    this.writer = opts.writer ?? Keypair.generate().publicKey.toBase58();
    this.name = opts.name ?? "ProofAPI Demo";
    this.clock = opts.clock ?? (() => Math.floor(Date.now() / 1000));
  }

  issuerAddress(): string {
    return this.address;
  }

  async ensureIssuer(): Promise<IssuerState> {
    if (!this.issuer) {
      this.issuer = {
        address: this.address,
        writer: this.writer,
        name: this.name,
        active: true,
        proofCount: 0,
        lastRecordHash: ZERO_HASH,
        createdAt: this.clock(),
      };
    }
    return { ...this.issuer };
  }

  async readIssuer(): Promise<IssuerState | null> {
    return this.issuer ? { ...this.issuer } : null;
  }

  async anchorProof(p: AnchorInput): Promise<AnchorResult> {
    if (this.failNextAnchor) {
      const error = this.failNextAnchor;
      this.failNextAnchor = null;
      throw error;
    }
    await this.ensureIssuer();
    const issuer = this.issuer!;
    if (!issuer.active) throw new ChainError("Issuer is inactive");
    const sequence = issuer.proofCount;
    const timestamp = this.clock();
    const prevRecordHash = issuer.lastRecordHash;
    const recordHash = computeRecordHash({ issuer: this.address, sequence, ...p, prevRecordHash, timestamp });
    const record: ChainProofRecord = {
      account: `memory:${sequence}`,
      issuer: this.address,
      sequence,
      ...p,
      prevRecordHash,
      recordHash,
      timestamp,
    };
    this.records.push(record);
    issuer.proofCount += 1;
    issuer.lastRecordHash = recordHash;
    return { signature: `memory-sig-${sequence}`, account: record.account, sequence, recordHash, prevRecordHash, timestamp };
  }

  async readProofBySequence(sequence: number): Promise<ChainProofRecord | null> {
    const record = this.records[sequence];
    return record ? { ...record } : null;
  }

  async readProofAccount(account: string): Promise<ChainProofRecord | null> {
    const match = /^memory:(\d+)$/.exec(account);
    return match ? this.readProofBySequence(Number(match[1])) : null;
  }

  explorerUrl(_signature: string): string | null {
    return null;
  }

  accountUrl(_account: string): string | null {
    return null;
  }

  evidenceContext(): EvidenceContext {
    return { cluster: "memory", rpcUrl: null, programId: null };
  }

  /** Test helper: deactivate or reactivate the issuer. */
  setActive(active: boolean): void {
    if (this.issuer) this.issuer.active = active;
  }

  /** Test helper: corrupt a stored record to simulate a forged chain. */
  overwriteRecord(sequence: number, patch: Partial<ChainProofRecord>): void {
    Object.assign(this.records[sequence], patch);
  }
}
