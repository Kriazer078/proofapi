import { PublicKey } from "@solana/web3.js";
import { ACCOUNT, ISSUER_SIZE, PROOF_RECORD_SIZE } from "@/lib/solana/encoding";
import { uuidToBytes } from "@/lib/solana/record-hash";
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
