import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const ZERO_HASH = "0".repeat(64);
const HEX64 = /^[0-9a-f]{64}$/;

export function hex32(hex: string): Buffer {
  if (!HEX64.test(hex)) throw new Error(`Expected 64 lowercase hex characters, got "${hex}"`);
  return Buffer.from(hex, "hex");
}

export function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) throw new Error(`Invalid UUID: ${uuid}`);
  return Buffer.from(hex, "hex");
}

export function bytesToUuid(bytes: Uint8Array): string {
  const h = Buffer.from(bytes).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export interface RecordHashInput {
  issuer: string;
  sequence: number;
  proofId: string;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  prevRecordHash: string;
  timestamp: number;
}

/** Byte-identical to the Anchor program's hashv(...) in Plan B. */
export function computeRecordHash(r: RecordHashInput): string {
  const seq = Buffer.alloc(8);
  seq.writeBigUInt64LE(BigInt(r.sequence));
  const ts = Buffer.alloc(8);
  ts.writeBigInt64LE(BigInt(r.timestamp));
  return createHash("sha256")
    .update(
      Buffer.concat([
        Buffer.from("proofapi-v1", "utf8"),
        new PublicKey(r.issuer).toBuffer(),
        seq,
        uuidToBytes(r.proofId),
        hex32(r.inputHash),
        hex32(r.outputHash),
        hex32(r.metadataHash),
        hex32(r.prevRecordHash),
        ts,
      ]),
    )
    .digest("hex");
}
