import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT,
  IX,
  ISSUER_SIZE,
  PROOF_RECORD_SIZE,
  createProofIx,
  decodeIssuer,
  decodeProofRecord,
  encodeName,
  issuerPda,
  proofPda,
  registerIssuerIx,
  setActiveIx,
  setWriterIx,
} from "@/lib/solana/encoding";
import { ZERO_HASH } from "@/lib/solana/record-hash";
import { issuerAccountBytes, proofAccountBytes } from "./helpers/fake-program";

const PROGRAM = new PublicKey(Buffer.alloc(32, 9));
const AUTHORITY = new PublicKey(Buffer.alloc(32, 1));
const WRITER = new PublicKey(Buffer.alloc(32, 2));
const ID = "123e4567-e89b-42d3-a456-426614174000";

describe("discriminators", () => {
  it("match sha256 prefixes computed for the program", () => {
    expect(IX.registerIssuer.toString("hex")).toBe("9175343bbd1b7f12");
    expect(IX.setWriter.toString("hex")).toBe("ae24b17a568e206d");
    expect(IX.setActive.toString("hex")).toBe("1d10e18426d8ce21");
    expect(IX.createProof.toString("hex")).toBe("9938ce98ed196a9a");
    expect(ACCOUNT.issuer.toString("hex")).toBe("d81353e66c35500e");
    expect(ACCOUNT.proofRecord.toString("hex")).toBe("ed3b9baccc75572c");
  });
});

describe("PDAs", () => {
  it("derive issuer and proof addresses from the documented seeds", () => {
    const issuer = issuerPda(PROGRAM, AUTHORITY);
    const [expectedIssuer] = PublicKey.findProgramAddressSync([Buffer.from("issuer"), AUTHORITY.toBuffer()], PROGRAM);
    expect(issuer.equals(expectedIssuer)).toBe(true);
    const seq = Buffer.alloc(8);
    seq.writeBigUInt64LE(3n);
    const [expectedProof] = PublicKey.findProgramAddressSync([Buffer.from("proof"), issuer.toBuffer(), seq], PROGRAM);
    expect(proofPda(PROGRAM, issuer, 3).equals(expectedProof)).toBe(true);
    expect(proofPda(PROGRAM, issuer, 4).equals(expectedProof)).toBe(false);
  });
});

describe("instructions", () => {
  it("encodes register_issuer", () => {
    const ix = registerIssuerIx(PROGRAM, AUTHORITY, WRITER, "Acme");
    expect(ix.programId.equals(PROGRAM)).toBe(true);
    expect(ix.data).toHaveLength(8 + 32 + 32);
    expect(ix.data.subarray(0, 8).equals(IX.registerIssuer)).toBe(true);
    expect(ix.data.subarray(8, 12).toString("utf8")).toBe("Acme");
    expect(ix.data.subarray(12, 40).every((b) => b === 0)).toBe(true);
    expect(ix.data.subarray(40, 72).equals(WRITER.toBuffer())).toBe(true);
    expect(ix.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
      [issuerPda(PROGRAM, AUTHORITY).toBase58(), false, true],
      [AUTHORITY.toBase58(), true, true],
      [SystemProgram.programId.toBase58(), false, false],
    ]);
  });

  it("encodes set_writer and set_active", () => {
    const w = setWriterIx(PROGRAM, AUTHORITY, WRITER);
    expect(w.data.subarray(0, 8).equals(IX.setWriter)).toBe(true);
    expect(w.data.subarray(8).equals(WRITER.toBuffer())).toBe(true);
    const off = setActiveIx(PROGRAM, AUTHORITY, false);
    expect([...off.data.subarray(8)]).toEqual([0]);
    expect([...setActiveIx(PROGRAM, AUTHORITY, true).data.subarray(8)]).toEqual([1]);
    expect(off.keys.map((k) => [k.isSigner, k.isWritable])).toEqual([
      [false, true],
      [true, false],
    ]);
  });

  it("encodes create_proof for the next sequence number", () => {
    const issuer = issuerPda(PROGRAM, AUTHORITY);
    const ix = createProofIx(PROGRAM, issuer, WRITER, 7, {
      proofId: ID,
      inputHash: "aa".repeat(32),
      outputHash: "bb".repeat(32),
      metadataHash: "cc".repeat(32),
    });
    expect(ix.data).toHaveLength(8 + 16 + 96);
    expect(ix.data.subarray(8, 24).toString("hex")).toBe("123e4567e89b42d3a456426614174000");
    expect(ix.data.subarray(24, 56).toString("hex")).toBe("aa".repeat(32));
    expect(ix.data.subarray(88, 120).toString("hex")).toBe("cc".repeat(32));
    expect(ix.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
      [issuer.toBase58(), false, true],
      [proofPda(PROGRAM, issuer, 7).toBase58(), false, true],
      [WRITER.toBase58(), true, true],
      [SystemProgram.programId.toBase58(), false, false],
    ]);
  });

  it("rejects names that do not fit 32 bytes", () => {
    expect(() => encodeName("")).toThrow("Issuer name must be 1-32 bytes");
    expect(() => encodeName("x".repeat(33))).toThrow("Issuer name must be 1-32 bytes");
    expect(encodeName("é".repeat(16))).toHaveLength(32);
  });
});

describe("account decoding", () => {
  it("decodes an Issuer account", () => {
    const address = Keypair.generate().publicKey;
    const data = issuerAccountBytes({
      authority: AUTHORITY,
      writer: WRITER,
      name: "ProofAPI Demo",
      active: true,
      proofCount: 12,
      lastRecordHash: "ab".repeat(32),
      createdAt: 1790000000,
    });
    expect(data).toHaveLength(ISSUER_SIZE);
    expect(decodeIssuer(address, data)).toEqual({
      address: address.toBase58(),
      authority: AUTHORITY.toBase58(),
      writer: WRITER.toBase58(),
      name: "ProofAPI Demo",
      active: true,
      proofCount: 12,
      lastRecordHash: "ab".repeat(32),
      createdAt: 1790000000,
    });
  });

  it("decodes a ProofRecord account", () => {
    const account = Keypair.generate().publicKey;
    const record = {
      issuer: issuerPda(PROGRAM, AUTHORITY).toBase58(),
      sequence: 4,
      proofId: ID,
      inputHash: "01".repeat(32),
      outputHash: "02".repeat(32),
      metadataHash: "03".repeat(32),
      prevRecordHash: ZERO_HASH,
      recordHash: "04".repeat(32),
      timestamp: 1790000123,
    };
    const data = proofAccountBytes(record);
    expect(data).toHaveLength(PROOF_RECORD_SIZE);
    expect(decodeProofRecord(account, data)).toEqual({ account: account.toBase58(), ...record });
  });

  it("refuses accounts of the wrong type or size", () => {
    const address = Keypair.generate().publicKey;
    const proof = proofAccountBytes({
      issuer: AUTHORITY.toBase58(),
      sequence: 0,
      proofId: ID,
      inputHash: ZERO_HASH,
      outputHash: ZERO_HASH,
      metadataHash: ZERO_HASH,
      prevRecordHash: ZERO_HASH,
      recordHash: ZERO_HASH,
      timestamp: 0,
    });
    expect(() => decodeIssuer(address, proof)).toThrow("Not an Issuer account");
    expect(() => decodeProofRecord(address, proof.subarray(0, 100))).toThrow("Not a ProofRecord account");
  });
});
