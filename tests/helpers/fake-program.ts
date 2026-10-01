import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  ACCOUNT,
  IX,
  ISSUER_SIZE,
  PROOF_RECORD_SIZE,
  type DecodedIssuer,
  decodeIssuer,
  issuerPda,
  proofPda,
  registerIssuerIx,
} from "@/lib/solana/encoding";
import { ZERO_HASH, bytesToUuid, computeRecordHash, uuidToBytes } from "@/lib/solana/record-hash";
import type { AccountData, SolanaRpc } from "@/lib/solana/rpc";
import type { ChainProofRecord } from "@/lib/solana/types";

/** Lays out an Issuer account exactly as the Rust program stores it (see "Byte layouts" in Plan B). */
export function issuerAccountBytes(f: {
  authority: PublicKey;
  writer: PublicKey;
  name: string;
  active: boolean;
  proofCount: number;
  lastRecordHash: string;
  createdAt: number;
  bump?: number;
}): Buffer {
  const b = Buffer.alloc(ISSUER_SIZE);
  ACCOUNT.issuer.copy(b, 0);
  f.authority.toBuffer().copy(b, 8);
  f.writer.toBuffer().copy(b, 40);
  Buffer.from(f.name, "utf8").copy(b, 72);
  b[104] = f.active ? 1 : 0;
  b.writeBigUInt64LE(BigInt(f.proofCount), 105);
  Buffer.from(f.lastRecordHash, "hex").copy(b, 113);
  b.writeBigInt64LE(BigInt(f.createdAt), 145);
  b[153] = f.bump ?? 255;
  return b;
}

/** Lays out a ProofRecord account exactly as the Rust program stores it. */
export function proofAccountBytes(r: Omit<ChainProofRecord, "account">, bump = 255): Buffer {
  const b = Buffer.alloc(PROOF_RECORD_SIZE);
  ACCOUNT.proofRecord.copy(b, 0);
  new PublicKey(r.issuer).toBuffer().copy(b, 8);
  b.writeBigUInt64LE(BigInt(r.sequence), 40);
  uuidToBytes(r.proofId).copy(b, 48);
  Buffer.from(r.inputHash, "hex").copy(b, 64);
  Buffer.from(r.outputHash, "hex").copy(b, 96);
  Buffer.from(r.metadataHash, "hex").copy(b, 128);
  Buffer.from(r.prevRecordHash, "hex").copy(b, 160);
  Buffer.from(r.recordHash, "hex").copy(b, 192);
  b.writeBigInt64LE(BigInt(r.timestamp), 224);
  b[232] = bump;
  return b;
}

/**
 * Byte-level TypeScript model of the proof_registry program (Plan B Task 5).
 * It decodes real instruction bytes and writes real account bytes, so tests
 * exercise the same encoding the devnet program sees.
 */
export class FakeProgramRpc implements SolanaRpc {
  readonly accounts = new Map<string, AccountData>();
  failNextSend: Error | null = null;
  private signatures = 0;
  private readonly clock: () => number;

  constructor(readonly programId: PublicKey, clock?: () => number) {
    let t = 1790000000;
    this.clock = clock ?? (() => t++);
  }

  async getAccount(address: PublicKey): Promise<AccountData | null> {
    const a = this.accounts.get(address.toBase58());
    return a ? { owner: a.owner, data: Buffer.from(a.data) } : null;
  }

  async getAccounts(addresses: PublicKey[]): Promise<(AccountData | null)[]> {
    return Promise.all(addresses.map((a) => this.getAccount(a)));
  }

  async send(ix: TransactionInstruction, signers: Keypair[]): Promise<string> {
    if (this.failNextSend) {
      const e = this.failNextSend;
      this.failNextSend = null;
      throw e;
    }
    if (!ix.programId.equals(this.programId)) throw new Error("Unknown program");
    const signed = (k: PublicKey) => signers.some((s) => s.publicKey.equals(k));
    const key = (i: number) => ix.keys[i].pubkey;
    const disc = ix.data.subarray(0, 8);
    const args = ix.data.subarray(8);

    if (disc.equals(IX.registerIssuer)) {
      const [issuer, authority] = [key(0), key(1)];
      if (!signed(authority)) throw new Error("Missing signature");
      if (!issuer.equals(issuerPda(this.programId, authority))) throw new Error("ConstraintSeeds");
      if (this.accounts.has(issuer.toBase58())) throw new Error("Account already in use");
      const nameBytes = args.subarray(0, 32);
      const end = nameBytes.indexOf(0);
      this.put(
        issuer,
        issuerAccountBytes({
          authority,
          writer: new PublicKey(args.subarray(32, 64)),
          name: nameBytes.subarray(0, end === -1 ? 32 : end).toString("utf8"),
          active: true,
          proofCount: 0,
          lastRecordHash: ZERO_HASH,
          createdAt: this.clock(),
        }),
      );
    } else if (disc.equals(IX.setActive) || disc.equals(IX.setWriter)) {
      const [issuer, authority] = [key(0), key(1)];
      if (!signed(authority)) throw new Error("Missing signature");
      const state = this.issuerState(issuer);
      if (state.authority !== authority.toBase58()) throw new Error("ConstraintHasOne");
      if (disc.equals(IX.setActive)) state.active = args[0] === 1;
      else state.writer = new PublicKey(args.subarray(0, 32)).toBase58();
      this.writeIssuer(issuer, state);
    } else if (disc.equals(IX.createProof)) {
      const [issuer, proof, writer] = [key(0), key(1), key(2)];
      if (!signed(writer)) throw new Error("Missing signature");
      const state = this.issuerState(issuer);
      if (state.writer !== writer.toBase58()) throw new Error("UnauthorizedWriter");
      if (!state.active) throw new Error("IssuerInactive");
      if (!proof.equals(proofPda(this.programId, issuer, state.proofCount))) throw new Error("ConstraintSeeds");
      if (this.accounts.has(proof.toBase58())) throw new Error("Account already in use");
      const fields = {
        issuer: issuer.toBase58(),
        sequence: state.proofCount,
        proofId: bytesToUuid(args.subarray(0, 16)),
        inputHash: args.subarray(16, 48).toString("hex"),
        outputHash: args.subarray(48, 80).toString("hex"),
        metadataHash: args.subarray(80, 112).toString("hex"),
        prevRecordHash: state.lastRecordHash,
        timestamp: this.clock(),
      };
      const recordHash = computeRecordHash(fields);
      this.put(proof, proofAccountBytes({ ...fields, recordHash }));
      state.proofCount += 1;
      state.lastRecordHash = recordHash;
      this.writeIssuer(issuer, state);
    } else {
      throw new Error("InstructionFallbackNotFound");
    }
    return `fake-sig-${this.signatures++}`;
  }

  /** Test helper: store raw bytes under an address with any owner. */
  plant(address: PublicKey, data: Buffer, owner: PublicKey = this.programId): void {
    this.accounts.set(address.toBase58(), { owner, data });
  }

  private put(address: PublicKey, data: Buffer): void {
    this.plant(address, data);
  }

  private issuerState(address: PublicKey): DecodedIssuer {
    const a = this.accounts.get(address.toBase58());
    if (!a) throw new Error("AccountNotInitialized");
    return decodeIssuer(address, a.data);
  }

  private writeIssuer(address: PublicKey, s: DecodedIssuer): void {
    this.put(
      address,
      issuerAccountBytes({
        authority: new PublicKey(s.authority),
        writer: new PublicKey(s.writer),
        name: s.name,
        active: s.active,
        proofCount: s.proofCount,
        lastRecordHash: s.lastRecordHash,
        createdAt: s.createdAt,
      }),
    );
  }
}

/** A registered issuer on a fresh fake program, ready for AnchorChainClient. */
export async function fakeDevnet(name = "ProofAPI Demo") {
  const programId = Keypair.generate().publicKey;
  const rpc = new FakeProgramRpc(programId);
  const authority = Keypair.generate();
  const writer = Keypair.generate();
  await rpc.send(registerIssuerIx(programId, authority.publicKey, writer.publicKey, name), [authority]);
  return { rpc, programId, authority, writer };
}
