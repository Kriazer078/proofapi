import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { ZERO_HASH, bytesToUuid, computeRecordHash, uuidToBytes } from "@/lib/solana/record-hash";

const ISSUER = new PublicKey(Buffer.alloc(32, 7)).toBase58();
const ID = "123e4567-e89b-42d3-a456-426614174000";
const base = {
  issuer: ISSUER,
  sequence: 5,
  proofId: ID,
  inputHash: "aa".repeat(32),
  outputHash: "bb".repeat(32),
  metadataHash: "cc".repeat(32),
  prevRecordHash: ZERO_HASH,
  timestamp: 1790000000,
};

describe("uuid bytes", () => {
  it("round-trips", () => {
    expect(uuidToBytes(ID)).toHaveLength(16);
    expect(bytesToUuid(uuidToBytes(ID))).toBe(ID);
  });
  it("rejects invalid ids", () => {
    expect(() => uuidToBytes("nope")).toThrow("Invalid UUID");
  });
});

describe("computeRecordHash", () => {
  it("hashes fields in the documented byte layout", () => {
    const seq = Buffer.alloc(8);
    seq.writeBigUInt64LE(5n);
    const ts = Buffer.alloc(8);
    ts.writeBigInt64LE(1790000000n);
    const expected = createHash("sha256")
      .update(
        Buffer.concat([
          Buffer.from("proofapi-v1"),
          Buffer.alloc(32, 7),
          seq,
          uuidToBytes(ID),
          Buffer.from("aa".repeat(32), "hex"),
          Buffer.from("bb".repeat(32), "hex"),
          Buffer.from("cc".repeat(32), "hex"),
          Buffer.alloc(32, 0),
          ts,
        ]),
      )
      .digest("hex");
    expect(computeRecordHash(base)).toBe(expected);
  });
  it("changes when any field changes", () => {
    const h = computeRecordHash(base);
    expect(computeRecordHash({ ...base, sequence: 6 })).not.toBe(h);
    expect(computeRecordHash({ ...base, outputHash: "bd".repeat(32) })).not.toBe(h);
    expect(computeRecordHash({ ...base, prevRecordHash: "01".repeat(32) })).not.toBe(h);
    expect(computeRecordHash({ ...base, timestamp: 1790000001 })).not.toBe(h);
  });
  it("rejects malformed hashes", () => {
    expect(() => computeRecordHash({ ...base, inputHash: "zz" })).toThrow("Expected 64 lowercase hex characters");
  });
});
