import { type Keypair, PublicKey } from "@solana/web3.js";
import { ChainError } from "../errors";
import { createProofIx, decodeIssuer, decodeProofRecord, issuerPda, proofPda } from "./encoding";
import type { AccountData, SolanaRpc } from "./rpc";
import type { AnchorInput, AnchorResult, ChainClient, ChainProofRecord, EvidenceContext, IssuerState } from "./types";

export interface AnchorClientOptions {
  rpc: SolanaRpc;
  programId: PublicKey;
  authority: PublicKey;
  writer: Keypair;
  cluster: string;
  rpcUrl: string;
}

/** ChainClient backed by the real proof_registry program. */
export class AnchorChainClient implements ChainClient {
  readonly mode = "anchor" as const;
  private readonly issuer: PublicKey;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly o: AnchorClientOptions) {
    this.issuer = issuerPda(o.programId, o.authority);
  }

  issuerAddress(): string {
    return this.issuer.toBase58();
  }

  async readIssuer(): Promise<IssuerState | null> {
    const account = await this.o.rpc.getAccount(this.issuer);
    if (!this.ours(account)) return null;
    const { authority: _authority, ...state } = decodeIssuer(this.issuer, account.data);
    return state;
  }

  async ensureIssuer(): Promise<IssuerState> {
    const issuer = await this.readIssuer();
    if (!issuer) throw new ChainError(`Issuer ${this.issuerAddress()} is not registered on Solana. Run npm run register-issuer.`);
    const writer = this.o.writer.publicKey.toBase58();
    if (issuer.writer !== writer) throw new ChainError(`This server's key ${writer} is not the issuer's writer ${issuer.writer}`);
    return issuer;
  }

  /** Writes are queued: the next sequence number is read from the chain, so two in flight would collide. */
  anchorProof(p: AnchorInput): Promise<AnchorResult> {
    const run = this.queue.then(() => this.write(p));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async write(p: AnchorInput): Promise<AnchorResult> {
    const issuer = await this.ensureIssuer();
    if (!issuer.active) throw new ChainError("Issuer is inactive. Its authority must reactivate it before new proofs can be recorded.");
    const sequence = issuer.proofCount;
    const ix = createProofIx(this.o.programId, this.issuer, this.o.writer.publicKey, sequence, p);
    const signature = await this.o.rpc.send(ix, [this.o.writer]);
    const record = await this.readProofBySequence(sequence);
    if (!record || record.proofId !== p.proofId) {
      throw new ChainError(`Transaction ${signature} was confirmed but record #${sequence} could not be read back`);
    }
    return {
      signature,
      account: record.account,
      sequence,
      recordHash: record.recordHash,
      prevRecordHash: record.prevRecordHash,
      timestamp: record.timestamp,
    };
  }

  readProofBySequence(sequence: number): Promise<ChainProofRecord | null> {
    return this.readProofAccount(proofPda(this.o.programId, this.issuer, sequence).toBase58());
  }

  async readProofAccount(account: string): Promise<ChainProofRecord | null> {
    let key: PublicKey;
    try {
      key = new PublicKey(account);
    } catch {
      return null;
    }
    const data = await this.o.rpc.getAccount(key);
    if (!this.ours(data)) return null;
    try {
      return decodeProofRecord(key, data.data);
    } catch {
      return null;
    }
  }

  explorerUrl(signature: string): string | null {
    return `https://explorer.solana.com/tx/${signature}${this.clusterQuery()}`;
  }

  accountUrl(account: string): string | null {
    return `https://explorer.solana.com/address/${account}${this.clusterQuery()}`;
  }

  evidenceContext(): EvidenceContext {
    return { cluster: this.o.cluster, rpcUrl: this.o.rpcUrl, programId: this.o.programId.toBase58() };
  }

  private ours(account: AccountData | null): account is AccountData {
    return account !== null && account.owner.equals(this.o.programId);
  }

  private clusterQuery(): string {
    return this.o.cluster === "mainnet-beta" ? "" : `?cluster=${this.o.cluster}`;
  }
}
