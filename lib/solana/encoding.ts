import { createHash } from "node:crypto";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { ValidationError } from "../errors";
import { bytesToUuid, hex32, uuidToBytes } from "./record-hash";
import type { AnchorInput, ChainProofRecord, IssuerState } from "./types";

export const ISSUER_SIZE = 154;
export const PROOF_RECORD_SIZE = 233;

/** Anchor discriminator: first 8 bytes of sha256("<namespace>:<name>"). */
export function discriminator(namespace: "global" | "account", name: string): Buffer {
  return createHash("sha256").update(`${namespace}:${name}`).digest().subarray(0, 8);
}

export const IX = {
  registerIssuer: discriminator("global", "register_issuer"),
  setWriter: discriminator("global", "set_writer"),
  setActive: discriminator("global", "set_active"),
  createProof: discriminator("global", "create_proof"),
};

export const ACCOUNT = {
  issuer: discriminator("account", "Issuer"),
  proofRecord: discriminator("account", "ProofRecord"),
};

export type DecodedIssuer = IssuerState & { authority: string };

function u64le(n: number): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
}

export function issuerPda(programId: PublicKey, authority: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("issuer"), authority.toBuffer()], programId)[0];
}

export function proofPda(programId: PublicKey, issuer: PublicKey, sequence: number): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("proof"), issuer.toBuffer(), u64le(sequence)], programId)[0];
}

export function encodeName(name: string): Buffer {
  const bytes = Buffer.from(name, "utf8");
  if (bytes.length === 0 || bytes.length > 32) throw new ValidationError("Issuer name must be 1-32 bytes of UTF-8");
  const out = Buffer.alloc(32);
  bytes.copy(out);
  return out;
}

function decodeName(bytes: Buffer): string {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end === -1 ? bytes.length : end).toString("utf8");
}

export function registerIssuerIx(programId: PublicKey, authority: PublicKey, writer: PublicKey, name: string): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: issuerPda(programId, authority), isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([IX.registerIssuer, encodeName(name), writer.toBuffer()]),
  });
}

function manageKeys(programId: PublicKey, authority: PublicKey) {
  return [
    { pubkey: issuerPda(programId, authority), isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: false },
  ];
}

export function setWriterIx(programId: PublicKey, authority: PublicKey, newWriter: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: manageKeys(programId, authority),
    data: Buffer.concat([IX.setWriter, newWriter.toBuffer()]),
  });
}

export function setActiveIx(programId: PublicKey, authority: PublicKey, active: boolean): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: manageKeys(programId, authority),
    data: Buffer.concat([IX.setActive, Buffer.from([active ? 1 : 0])]),
  });
}

export function createProofIx(
  programId: PublicKey,
  issuer: PublicKey,
  writer: PublicKey,
  sequence: number,
  p: AnchorInput,
): TransactionInstruction {
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: issuer, isSigner: false, isWritable: true },
      { pubkey: proofPda(programId, issuer, sequence), isSigner: false, isWritable: true },
      { pubkey: writer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      IX.createProof,
      uuidToBytes(p.proofId),
      hex32(p.inputHash),
      hex32(p.outputHash),
      hex32(p.metadataHash),
    ]),
  });
}

const hexAt = (d: Buffer, start: number) => d.subarray(start, start + 32).toString("hex");
const keyAt = (d: Buffer, start: number) => new PublicKey(d.subarray(start, start + 32)).toBase58();

export function decodeIssuer(address: PublicKey, data: Buffer): DecodedIssuer {
  if (data.length < ISSUER_SIZE || !data.subarray(0, 8).equals(ACCOUNT.issuer)) throw new Error("Not an Issuer account");
  return {
    address: address.toBase58(),
    authority: keyAt(data, 8),
    writer: keyAt(data, 40),
    name: decodeName(data.subarray(72, 104)),
    active: data[104] === 1,
    proofCount: Number(data.readBigUInt64LE(105)),
    lastRecordHash: hexAt(data, 113),
    createdAt: Number(data.readBigInt64LE(145)),
  };
}

export function decodeProofRecord(account: PublicKey, data: Buffer): ChainProofRecord {
  if (data.length < PROOF_RECORD_SIZE || !data.subarray(0, 8).equals(ACCOUNT.proofRecord)) {
    throw new Error("Not a ProofRecord account");
  }
  return {
    account: account.toBase58(),
    issuer: keyAt(data, 8),
    sequence: Number(data.readBigUInt64LE(40)),
    proofId: bytesToUuid(data.subarray(48, 64)),
    inputHash: hexAt(data, 64),
    outputHash: hexAt(data, 96),
    metadataHash: hexAt(data, 128),
    prevRecordHash: hexAt(data, 160),
    recordHash: hexAt(data, 192),
    timestamp: Number(data.readBigInt64LE(224)),
  };
}
