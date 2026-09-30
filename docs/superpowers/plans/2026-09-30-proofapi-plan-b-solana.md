# ProofAPI Plan B — Solana program, real chain client, verifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory chain with our own Anchor program `proof_registry` on Solana devnet, add key and issuer setup scripts, and ship a standalone `verifier.html` that checks an evidence pack against Solana without our server.

**Architecture:** The Rust program (spec v2 §4) is built and deployed through Solana Playground. The app talks to it through `AnchorChainClient`, which implements the existing `ChainClient` interface from Plan A with hand-written Anchor encoding (`lib/solana/encoding.ts`) on top of `@solana/web3.js` v1. All RPC goes through a two-method `SolanaRpc` interface; tests use `FakeProgramRpc`, a byte-level TypeScript model of the program, so the client, encoding and the Plan A services are tested end to end without a network. `CHAIN_MODE=anchor` switches the app over; UI and services stay unchanged.

**Tech Stack:** Rust + Anchor (Solana Playground), `@solana/web3.js` 1.x, TypeScript 5, Vitest 3, `tsx` for scripts, plain HTML/JS + WebCrypto for the verifier.

**Specs:** [spec v2](../specs/2026-09-30-proofapi-mvp-design.md) §4, §6, §9, §12, §12a, §13. **Depends on:** [Plan A](2026-09-30-proofapi-plan-a-app.md) Tasks 1–11 (logic and API). The UI tasks of Plan A (12–17) are not needed for Plan B.

**Conventions:**
- Shell commands are for Git Bash in the project root (`C:\Users\User.DESKTOP-T27SALG\Downloads\project\ProofAPI`).
- Files inside `lib/` import each other with relative paths; `tests/` and `scripts/` use `@/` or relative paths as shown.
- Commit after every task with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Tasks 1–4 and 6–8 need no network and no SOL. Task 5 (deploy) and Task 9 (devnet run) need the user: GitHub login on the faucet and a click on Deploy in Playground.

---

## Byte layouts (single source of truth for this plan)

Anchor discriminators (first 8 bytes of SHA-256):

| Name | Preimage | Hex |
|---|---|---|
| register_issuer | `global:register_issuer` | `9175343bbd1b7f12` |
| set_writer | `global:set_writer` | `ae24b17a568e206d` |
| set_active | `global:set_active` | `1d10e18426d8ce21` |
| create_proof | `global:create_proof` | `9938ce98ed196a9a` |
| Issuer account | `account:Issuer` | `d81353e66c35500e` |
| ProofRecord account | `account:ProofRecord` | `ed3b9baccc75572c` |

`Issuer` (154 bytes): `0..8` discriminator, `8..40` authority, `40..72` writer, `72..104` name (UTF-8, zero padded), `104` active, `105..113` proof_count u64 LE, `113..145` last_record_hash, `145..153` created_at i64 LE, `153` bump.

`ProofRecord` (233 bytes): `0..8` discriminator, `8..40` issuer, `40..48` sequence u64 LE, `48..64` proof_id, `64..96` input_hash, `96..128` output_hash, `128..160` metadata_hash, `160..192` prev_record_hash, `192..224` record_hash, `224..232` timestamp i64 LE, `232` bump.

Instruction data (Borsh): `register_issuer` = disc ‖ name[32] ‖ writer[32]; `set_writer` = disc ‖ new_writer[32]; `set_active` = disc ‖ u8 (0/1); `create_proof` = disc ‖ proof_id[16] ‖ input[32] ‖ output[32] ‖ metadata[32].

Account order: `register_issuer` [issuer (w), authority (s, w), system_program]; `set_writer` / `set_active` [issuer (w), authority (s)]; `create_proof` [issuer (w), proof (w), writer (s, w), system_program].

`record_hash = SHA256("proofapi-v1" ‖ ProofRecord bytes 8..192 ‖ ProofRecord bytes 224..232)`, which is the same as the Plan A formula in `lib/solana/record-hash.ts`.

---

## File map

```
programs/proof_registry/src/lib.rs          Anchor program (built in Solana Playground)
programs/proof_registry/tests/proof_registry.test.ts   Playground tests
programs/proof_registry/README.md           build and deploy steps

lib/solana/encoding.ts        discriminators, PDAs, instruction builders, account decoders
lib/solana/rpc.ts             SolanaRpc interface + ConnectionRpc (web3.js)
lib/solana/anchor-client.ts   AnchorChainClient implements ChainClient
lib/solana/anchor-config.ts   env -> validated config, keypair loading
lib/solana/index.ts           (modify) CHAIN_MODE=anchor

scripts/lib/env-file.ts       upsertEnv() for .env edits
scripts/setup-keys.ts         npm run setup
scripts/register-issuer.ts    npm run register-issuer
scripts/set-active.ts         npm run issuer:active -- true|false
scripts/chain-status.ts       npm run chain:status
scripts/e2e-devnet.ts         npm run e2e:devnet

public/verifier.html          standalone verifier (no dependencies, no ProofAPI calls)

tests/helpers/fake-program.ts FakeProgramRpc + account byte builders
tests/encoding.test.ts, tests/anchor-client.test.ts, tests/anchor-service.test.ts
tests/anchor-config.test.ts, tests/env-file.test.ts, tests/verifier-html.test.ts
```

---

### Task 1: Anchor encoding

**Files:**
- Create: `lib/solana/encoding.ts`, `tests/helpers/fake-program.ts` (account builders only in this task)
- Test: `tests/encoding.test.ts`

- [ ] **Step 1: Write the account byte builders used by tests**

`tests/helpers/fake-program.ts`:
```ts
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
```

- [ ] **Step 2: Write the failing test**

`tests/encoding.test.ts`:
```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/encoding.test.ts`
Expected: FAIL — cannot resolve `@/lib/solana/encoding`.

- [ ] **Step 4: Implement**

`lib/solana/encoding.ts`:
```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/encoding.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/solana/encoding.ts tests/encoding.test.ts tests/helpers/fake-program.ts
git commit -m "feat: add Anchor instruction and account encoding for proof_registry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: RPC interface, fake program and `AnchorChainClient`

**Files:**
- Create: `lib/solana/rpc.ts`, `lib/solana/anchor-client.ts`
- Modify: `tests/helpers/fake-program.ts` (append `FakeProgramRpc`)
- Test: `tests/anchor-client.test.ts`

- [ ] **Step 1: Write the RPC interface**

`lib/solana/rpc.ts`:
```ts
import { type Connection, type Keypair, type PublicKey, Transaction, type TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";

export interface AccountData {
  owner: PublicKey;
  data: Buffer;
}

/** The two network operations the app needs. Tests swap in FakeProgramRpc. */
export interface SolanaRpc {
  getAccount(address: PublicKey): Promise<AccountData | null>;
  send(ix: TransactionInstruction, signers: Keypair[]): Promise<string>;
}

export class ConnectionRpc implements SolanaRpc {
  constructor(private readonly connection: Connection) {}

  async getAccount(address: PublicKey): Promise<AccountData | null> {
    const info = await this.connection.getAccountInfo(address, "confirmed");
    return info ? { owner: info.owner, data: Buffer.from(info.data) } : null;
  }

  async send(ix: TransactionInstruction, signers: Keypair[]): Promise<string> {
    return sendAndConfirmTransaction(this.connection, new Transaction().add(ix), signers, { commitment: "confirmed" });
  }
}
```

- [ ] **Step 2: Append the fake program to the test helper**

Append to `tests/helpers/fake-program.ts` (and extend its imports as shown):
```ts
// add to the imports at the top of the file:
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { IX, type DecodedIssuer, decodeIssuer, issuerPda, proofPda, registerIssuerIx } from "@/lib/solana/encoding";
import { ZERO_HASH, bytesToUuid, computeRecordHash } from "@/lib/solana/record-hash";
import type { AccountData, SolanaRpc } from "@/lib/solana/rpc";

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
```

After this step the import block at the top of `tests/helpers/fake-program.ts` reads:
```ts
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
```

- [ ] **Step 3: Write the failing test**

`tests/anchor-client.test.ts`:
```ts
import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { ChainError } from "@/lib/errors";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { issuerPda, setActiveIx, setWriterIx } from "@/lib/solana/encoding";
import { ZERO_HASH, computeRecordHash } from "@/lib/solana/record-hash";
import { FakeProgramRpc, fakeDevnet, proofAccountBytes } from "./helpers/fake-program";

const input = (n: number) => ({
  proofId: `123e4567-e89b-42d3-a456-42661417400${n}`,
  inputHash: "aa".repeat(32),
  outputHash: "bb".repeat(32),
  metadataHash: "cc".repeat(32),
});

async function setup() {
  const net = await fakeDevnet();
  const client = new AnchorChainClient({
    rpc: net.rpc,
    programId: net.programId,
    authority: net.authority.publicKey,
    writer: net.writer,
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  });
  return { ...net, client };
}

describe("AnchorChainClient", () => {
  it("reports a clear error when the issuer is not registered", async () => {
    const programId = Keypair.generate().publicKey;
    const client = new AnchorChainClient({
      rpc: new FakeProgramRpc(programId),
      programId,
      authority: Keypair.generate().publicKey,
      writer: Keypair.generate(),
      cluster: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
    });
    expect(await client.readIssuer()).toBeNull();
    await expect(client.ensureIssuer()).rejects.toThrow("npm run register-issuer");
  });

  it("reads the registered issuer at its PDA", async () => {
    const { client, programId, authority, writer } = await setup();
    expect(client.issuerAddress()).toBe(issuerPda(programId, authority.publicKey).toBase58());
    expect(await client.ensureIssuer()).toMatchObject({
      name: "ProofAPI Demo",
      writer: writer.publicKey.toBase58(),
      active: true,
      proofCount: 0,
      lastRecordHash: ZERO_HASH,
    });
  });

  it("numbers records and links them into a hash chain", async () => {
    const { client } = await setup();
    const first = await client.anchorProof(input(1));
    const second = await client.anchorProof(input(2));
    expect(first).toMatchObject({ sequence: 0, prevRecordHash: ZERO_HASH, signature: "fake-sig-1" });
    expect(second).toMatchObject({ sequence: 1, prevRecordHash: first.recordHash });
    const record = await client.readProofAccount(second.account);
    expect(record).toEqual(await client.readProofBySequence(1));
    expect(computeRecordHash(record!)).toBe(second.recordHash);
    expect(await client.readIssuer()).toMatchObject({ proofCount: 2, lastRecordHash: second.recordHash });
  });

  it("serialises concurrent writes so each gets its own sequence", async () => {
    const { client } = await setup();
    const results = await Promise.all([client.anchorProof(input(1)), client.anchorProof(input(2)), client.anchorProof(input(3))]);
    expect(results.map((r) => r.sequence).sort()).toEqual([0, 1, 2]);
  });

  it("refuses to write when the issuer is inactive or the writer key was rotated", async () => {
    const { client, rpc, programId, authority } = await setup();
    await rpc.send(setActiveIx(programId, authority.publicKey, false), [authority]);
    await expect(client.anchorProof(input(1))).rejects.toBeInstanceOf(ChainError);
    await rpc.send(setActiveIx(programId, authority.publicKey, true), [authority]);
    await expect(client.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
    await rpc.send(setWriterIx(programId, authority.publicKey, Keypair.generate().publicKey), [authority]);
    await expect(client.anchorProof(input(2))).rejects.toThrow("is not the issuer's writer");
  });

  it("passes network failures through", async () => {
    const { client, rpc } = await setup();
    rpc.failNextSend = new Error("RPC down");
    await expect(client.anchorProof(input(1))).rejects.toThrow("RPC down");
    await expect(client.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
  });

  it("ignores accounts that are not our ProofRecords", async () => {
    const { client, rpc } = await setup();
    const r = await client.anchorProof(input(1));
    const foreign = Keypair.generate().publicKey;
    const bytes = proofAccountBytes({ ...(await client.readProofAccount(r.account))! });
    rpc.plant(foreign, bytes, Keypair.generate().publicKey);
    expect(await client.readProofAccount(foreign.toBase58())).toBeNull();
    const garbage = Keypair.generate().publicKey;
    rpc.plant(garbage, Buffer.alloc(233));
    expect(await client.readProofAccount(garbage.toBase58())).toBeNull();
    expect(await client.readProofAccount("not-a-key")).toBeNull();
    expect(await client.readProofBySequence(5)).toBeNull();
  });

  it("builds explorer links and evidence context", async () => {
    const { client, programId } = await setup();
    expect(client.mode).toBe("anchor");
    expect(client.explorerUrl("abc")).toBe("https://explorer.solana.com/tx/abc?cluster=devnet");
    expect(client.accountUrl("xyz")).toBe("https://explorer.solana.com/address/xyz?cluster=devnet");
    expect(client.evidenceContext()).toEqual({
      cluster: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
      programId: programId.toBase58(),
    });
  });
});
```

Note: `fakeDevnet()` already used signature `fake-sig-0` for `register_issuer`, so the first proof gets `fake-sig-1`.

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/anchor-client.test.ts`
Expected: FAIL — cannot resolve `@/lib/solana/anchor-client`.

- [ ] **Step 5: Implement**

`lib/solana/anchor-client.ts`:
```ts
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/anchor-client.test.ts tests/encoding.test.ts`
Expected: PASS (8 + 9 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/solana/rpc.ts lib/solana/anchor-client.ts tests/helpers/fake-program.ts tests/anchor-client.test.ts
git commit -m "feat: add AnchorChainClient with byte-level fake program for tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Services on the real client (integration test)

Proves the Plan A services (create, verify, tamper, delete, audit, retry, evidence) work unchanged with `AnchorChainClient`.

**Files:**
- Test: `tests/anchor-service.test.ts`

- [ ] **Step 1: Write the test**

`tests/anchor-service.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { auditHistory } from "@/lib/history-audit";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { verifyProof } from "@/lib/verifier";
import { fakeDevnet } from "./helpers/fake-program";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");
const id = (n: number) => `123e4567-e89b-42d3-a456-42661417400${n}`;

async function setup() {
  const net = await fakeDevnet();
  const chain = new AnchorChainClient({
    rpc: net.rpc,
    programId: net.programId,
    authority: net.authority.publicKey,
    writer: net.writer,
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  });
  let n = 0;
  const repo = new MemoryProofRepo();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => id(n++) });
  return { ...net, chain, repo, service, deps: { repo, chain } };
}

describe("proof services on the Anchor client", () => {
  it("creates and verifies a proof", async () => {
    const { service, deps, chain } = await setup();
    const { proof, chainError } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(chainError).toBeNull();
    expect(proof).toMatchObject({ status: "ANCHORED", sequence: 0, solanaTransaction: "fake-sig-1" });
    const result = await verifyProof(deps, proof.id);
    expect(result.status).toBe("VERIFIED");
    expect(result.checks.issuer.onChain).toBe(chain.issuerAddress());
    expect(result.explorerUrl).toBe("https://explorer.solana.com/tx/fake-sig-1?cluster=devnet");
  });

  it("detects tampering and restores", async () => {
    const { service, deps } = await setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await service.tamperOutput(id(0));
    const failed = await verifyProof(deps, id(0));
    expect(failed.status).toBe("FAILED");
    expect(failed.checks.output.ok).toBe(false);
    expect(failed.checks.input.ok).toBe(true);
    await service.restoreOutput(id(0));
    expect((await verifyProof(deps, id(0))).status).toBe("VERIFIED");
  });

  it("finds a record deleted from the database", async () => {
    const { service, deps } = await setup();
    await service.createProof({ fileName: "a.txt", bytes: CONTRACT });
    await service.createProof({ fileName: "b.txt", bytes: CONTRACT });
    await service.deleteProof(id(0));
    const audit = await auditHistory(deps);
    expect(audit.entries.map((e) => e.status)).toEqual(["MISSING_IN_DATABASE", "OK"]);
  });

  it("keeps the proof pending when Solana fails and anchors it on retry", async () => {
    const { service, rpc } = await setup();
    rpc.failNextSend = new Error("RPC down");
    const first = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(first.proof.status).toBe("PENDING_CHAIN");
    expect(first.chainError).toContain("RPC down");
    const retried = await service.retryAnchoring(id(0));
    expect(retried.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
  });

  it("builds an evidence pack that points at the devnet account", async () => {
    const { service, deps, programId } = await setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const pack = await buildEvidencePack(deps, proof.id);
    expect(pack).toMatchObject({
      cluster: "devnet",
      rpc_url: "https://api.devnet.solana.com",
      program_id: programId.toBase58(),
      proof_account: proof.account,
      sequence: 0,
    });
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/anchor-service.test.ts`
Expected: PASS (5 tests). This task adds no production code; if a test fails, the bug is in Task 1 or 2 (or in a Plan A service assumption about the chain) and must be fixed there.

- [ ] **Step 3: Commit**

```bash
git add tests/anchor-service.test.ts
git commit -m "test: run proof services end to end on the Anchor client" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Configuration and `CHAIN_MODE=anchor`

**Files:**
- Create: `lib/solana/anchor-config.ts`
- Modify: `lib/solana/index.ts`, `.env.example`
- Test: `tests/anchor-config.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/anchor-config.test.ts`:
```ts
import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { keypairFromJson, loadAnchorConfig } from "@/lib/solana/anchor-config";

const writer = Keypair.generate();
const files: Record<string, string> = { ".keys/writer.json": JSON.stringify(Array.from(writer.secretKey)) };
const read = (p: string) => {
  if (!(p in files)) throw new Error(`ENOENT: ${p}`);
  return files[p];
};
const base = {
  PROGRAM_ID: Keypair.generate().publicKey.toBase58(),
  AUTHORITY_PUBKEY: Keypair.generate().publicKey.toBase58(),
  WRITER_KEYPAIR_PATH: ".keys/writer.json",
};

describe("loadAnchorConfig", () => {
  it("loads a complete config with devnet defaults", () => {
    const cfg = loadAnchorConfig(base, read);
    expect(cfg.rpcUrl).toBe("https://api.devnet.solana.com");
    expect(cfg.cluster).toBe("devnet");
    expect(cfg.programId.toBase58()).toBe(base.PROGRAM_ID);
    expect(cfg.authority.toBase58()).toBe(base.AUTHORITY_PUBKEY);
    expect(cfg.writer.publicKey.equals(writer.publicKey)).toBe(true);
  });

  it("names every missing variable", () => {
    expect(() => loadAnchorConfig({ PROGRAM_ID: "" }, read)).toThrow(
      "CHAIN_MODE=anchor needs PROGRAM_ID, AUTHORITY_PUBKEY, WRITER_KEYPAIR_PATH in .env",
    );
  });

  it("explains invalid keys and files", () => {
    expect(() => loadAnchorConfig({ ...base, PROGRAM_ID: "nope" }, read)).toThrow("PROGRAM_ID is not a valid Solana address");
    expect(() => loadAnchorConfig({ ...base, WRITER_KEYPAIR_PATH: "missing.json" }, read)).toThrow("Cannot read keypair missing.json");
  });

  it("parses keypair files", () => {
    expect(keypairFromJson(files[".keys/writer.json"], "w").publicKey.equals(writer.publicKey)).toBe(true);
    expect(() => keypairFromJson("[1,2,3]", "w")).toThrow("w is not a Solana keypair file");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/anchor-config.test.ts`
Expected: FAIL — cannot resolve `@/lib/solana/anchor-config`.

- [ ] **Step 3: Implement**

`lib/solana/anchor-config.ts`:
```ts
import { readFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";

export interface AnchorConfig {
  rpcUrl: string;
  cluster: string;
  programId: PublicKey;
  authority: PublicKey;
  writer: Keypair;
}

type Env = Record<string, string | undefined>;
type ReadFile = (path: string) => string;

export function keypairFromJson(text: string, label: string): Keypair {
  let bytes: unknown;
  try {
    bytes = JSON.parse(text);
  } catch {
    bytes = null;
  }
  if (!Array.isArray(bytes) || bytes.length !== 64) throw new Error(`${label} is not a Solana keypair file (expected a JSON array of 64 numbers)`);
  return Keypair.fromSecretKey(Uint8Array.from(bytes as number[]));
}

function pubkey(env: Env, name: string): PublicKey {
  try {
    return new PublicKey(env[name]!);
  } catch {
    throw new Error(`${name} is not a valid Solana address`);
  }
}

export function loadAnchorConfig(env: Env, read: ReadFile = (p) => readFileSync(p, "utf8")): AnchorConfig {
  const required = ["PROGRAM_ID", "AUTHORITY_PUBKEY", "WRITER_KEYPAIR_PATH"];
  const missing = required.filter((k) => !env[k]);
  if (missing.length) throw new Error(`CHAIN_MODE=anchor needs ${missing.join(", ")} in .env. Run npm run setup and see programs/proof_registry/README.md.`);
  const path = env.WRITER_KEYPAIR_PATH!;
  let text: string;
  try {
    text = read(path);
  } catch {
    throw new Error(`Cannot read keypair ${path}. Run npm run setup.`);
  }
  return {
    rpcUrl: env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    cluster: env.SOLANA_CLUSTER || "devnet",
    programId: pubkey(env, "PROGRAM_ID"),
    authority: pubkey(env, "AUTHORITY_PUBKEY"),
    writer: keypairFromJson(text, path),
  };
}
```

Replace `lib/solana/index.ts` with:
```ts
import { Connection } from "@solana/web3.js";
import { AnchorChainClient } from "./anchor-client";
import { loadAnchorConfig } from "./anchor-config";
import { InMemoryChainClient } from "./memory-client";
import { ConnectionRpc } from "./rpc";
import type { ChainClient } from "./types";

const g = globalThis as { __proofapiChain?: ChainClient };

/** One chain client per server process; survives dev hot reloads. */
export function getChainClient(): ChainClient {
  if (g.__proofapiChain) return g.__proofapiChain;
  const mode = process.env.CHAIN_MODE ?? "memory";
  if (mode === "anchor") {
    const cfg = loadAnchorConfig(process.env);
    g.__proofapiChain = new AnchorChainClient({ rpc: new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed")), ...cfg });
  } else if (mode === "memory") {
    g.__proofapiChain = new InMemoryChainClient({ name: process.env.ISSUER_NAME ?? "ProofAPI Demo" });
  } else {
    throw new Error(`Unknown CHAIN_MODE=${mode}. Use memory or anchor.`);
  }
  return g.__proofapiChain;
}
```

Replace `.env.example` with:
```bash
# memory = local simulation of the Solana program; anchor = real program on devnet
CHAIN_MODE=memory
ISSUER_NAME="ProofAPI Demo"
DATABASE_URL="file:./dev.db"

# --- CHAIN_MODE=anchor (filled by npm run setup and the deploy steps) ---
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
PROGRAM_ID=
AUTHORITY_PUBKEY=
WRITER_KEYPAIR_PATH=.keys/writer.json
AUTHORITY_KEYPAIR_PATH=.keys/authority.json
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add lib/solana/anchor-config.ts lib/solana/index.ts .env.example tests/anchor-config.test.ts
git commit -m "feat: switch to the Solana program with CHAIN_MODE=anchor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Anchor program `proof_registry`

**Files:**
- Create: `programs/proof_registry/src/lib.rs`, `programs/proof_registry/tests/proof_registry.test.ts`, `programs/proof_registry/README.md`

These files are not compiled locally (no Rust toolchain). They are pasted into Solana Playground, where they are built, tested and deployed. `tsconfig.json` already excludes `programs/`.

- [ ] **Step 1: Write the program**

`programs/proof_registry/src/lib.rs`:
```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;

// Solana Playground replaces this with the deployed program id on Build.
declare_id!("11111111111111111111111111111111");

#[program]
pub mod proof_registry {
    use super::*;

    pub fn register_issuer(ctx: Context<RegisterIssuer>, name: [u8; 32], writer: Pubkey) -> Result<()> {
        require!(name[0] != 0, ProofError::EmptyName);
        let issuer = &mut ctx.accounts.issuer;
        issuer.authority = ctx.accounts.authority.key();
        issuer.writer = writer;
        issuer.name = name;
        issuer.active = true;
        issuer.proof_count = 0;
        issuer.last_record_hash = [0u8; 32];
        issuer.created_at = Clock::get()?.unix_timestamp;
        issuer.bump = ctx.bumps.issuer;
        emit!(IssuerRegistered { issuer: issuer.key(), authority: issuer.authority, writer });
        Ok(())
    }

    pub fn set_writer(ctx: Context<ManageIssuer>, new_writer: Pubkey) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer;
        emit!(WriterChanged { issuer: issuer.key(), old_writer: issuer.writer, new_writer });
        issuer.writer = new_writer;
        Ok(())
    }

    pub fn set_active(ctx: Context<ManageIssuer>, active: bool) -> Result<()> {
        let issuer = &mut ctx.accounts.issuer;
        issuer.active = active;
        emit!(ActiveChanged { issuer: issuer.key(), active });
        Ok(())
    }

    pub fn create_proof(
        ctx: Context<CreateProof>,
        proof_id: [u8; 16],
        input_hash: [u8; 32],
        output_hash: [u8; 32],
        metadata_hash: [u8; 32],
    ) -> Result<()> {
        let issuer_key = ctx.accounts.issuer.key();
        let issuer = &mut ctx.accounts.issuer;
        require!(issuer.active, ProofError::IssuerInactive);

        let sequence = issuer.proof_count;
        let prev_record_hash = issuer.last_record_hash;
        let timestamp = Clock::get()?.unix_timestamp;
        let record_hash = hashv(&[
            b"proofapi-v1",
            issuer_key.as_ref(),
            &sequence.to_le_bytes(),
            &proof_id,
            &input_hash,
            &output_hash,
            &metadata_hash,
            &prev_record_hash,
            &timestamp.to_le_bytes(),
        ])
        .to_bytes();

        let record = &mut ctx.accounts.proof;
        record.issuer = issuer_key;
        record.sequence = sequence;
        record.proof_id = proof_id;
        record.input_hash = input_hash;
        record.output_hash = output_hash;
        record.metadata_hash = metadata_hash;
        record.prev_record_hash = prev_record_hash;
        record.record_hash = record_hash;
        record.timestamp = timestamp;
        record.bump = ctx.bumps.proof;

        issuer.proof_count = sequence.checked_add(1).ok_or(ProofError::Overflow)?;
        issuer.last_record_hash = record_hash;

        emit!(ProofCreated { issuer: issuer_key, sequence, proof_id, record_hash, timestamp });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterIssuer<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Issuer::INIT_SPACE,
        seeds = [b"issuer", authority.key().as_ref()],
        bump
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageIssuer<'info> {
    #[account(
        mut,
        seeds = [b"issuer", authority.key().as_ref()],
        bump = issuer.bump,
        has_one = authority
    )]
    pub issuer: Account<'info, Issuer>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateProof<'info> {
    #[account(
        mut,
        seeds = [b"issuer", issuer.authority.as_ref()],
        bump = issuer.bump,
        has_one = writer @ ProofError::UnauthorizedWriter
    )]
    pub issuer: Account<'info, Issuer>,
    #[account(
        init,
        payer = writer,
        space = 8 + ProofRecord::INIT_SPACE,
        seeds = [b"proof", issuer.key().as_ref(), &issuer.proof_count.to_le_bytes()],
        bump
    )]
    pub proof: Account<'info, ProofRecord>,
    #[account(mut)]
    pub writer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Issuer {
    pub authority: Pubkey,
    pub writer: Pubkey,
    pub name: [u8; 32],
    pub active: bool,
    pub proof_count: u64,
    pub last_record_hash: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ProofRecord {
    pub issuer: Pubkey,
    pub sequence: u64,
    pub proof_id: [u8; 16],
    pub input_hash: [u8; 32],
    pub output_hash: [u8; 32],
    pub metadata_hash: [u8; 32],
    pub prev_record_hash: [u8; 32],
    pub record_hash: [u8; 32],
    pub timestamp: i64,
    pub bump: u8,
}

#[event]
pub struct IssuerRegistered {
    pub issuer: Pubkey,
    pub authority: Pubkey,
    pub writer: Pubkey,
}

#[event]
pub struct WriterChanged {
    pub issuer: Pubkey,
    pub old_writer: Pubkey,
    pub new_writer: Pubkey,
}

#[event]
pub struct ActiveChanged {
    pub issuer: Pubkey,
    pub active: bool,
}

#[event]
pub struct ProofCreated {
    pub issuer: Pubkey,
    pub sequence: u64,
    pub proof_id: [u8; 16],
    pub record_hash: [u8; 32],
    pub timestamp: i64,
}

#[error_code]
pub enum ProofError {
    #[msg("Issuer is inactive")]
    IssuerInactive,
    #[msg("Signer is not the issuer's writer")]
    UnauthorizedWriter,
    #[msg("Issuer name must not be empty")]
    EmptyName,
    #[msg("Sequence overflow")]
    Overflow,
}
```

- [ ] **Step 2: Write the Playground tests**

`programs/proof_registry/tests/proof_registry.test.ts` (runs inside Solana Playground, where `pg`, `web3`, `anchor` and `assert` are globals):
```ts
const enc = new TextEncoder();

async function sha256(parts: Uint8Array[]): Promise<Uint8Array> {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    buf.set(p, off);
    off += p.length;
  }
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}

function u64(n: number): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, BigInt(n), true);
  return b;
}

function nameBytes(s: string): number[] {
  const out = new Array(32).fill(0);
  enc.encode(s).forEach((b, i) => (out[i] = b));
  return out;
}

const bytes = (n: number, v: number) => new Array(n).fill(v);

describe("proof_registry", () => {
  const authority = new web3.Keypair();
  const [issuer] = web3.PublicKey.findProgramAddressSync([enc.encode("issuer"), authority.publicKey.toBuffer()], pg.PROGRAM_ID);
  const proofAt = (seq: number) =>
    web3.PublicKey.findProgramAddressSync([enc.encode("proof"), issuer.toBuffer(), u64(seq)], pg.PROGRAM_ID)[0];

  async function fund(to: web3.PublicKey, sol: number) {
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({ fromPubkey: pg.wallet.publicKey, toPubkey: to, lamports: sol * web3.LAMPORTS_PER_SOL }),
    );
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);
  }

  async function createProof(writer: web3.Keypair | null, seq: number, fill: number) {
    const signer = writer ?? pg.wallet.keypair;
    return pg.program.methods
      .createProof(bytes(16, fill), bytes(32, fill), bytes(32, fill + 1), bytes(32, fill + 2))
      .accounts({ issuer, proof: proofAt(seq), writer: signer.publicKey, systemProgram: web3.SystemProgram.programId })
      .signers(writer ? [writer] : [])
      .rpc();
  }

  it("registers an issuer", async () => {
    await fund(authority.publicKey, 0.05);
    await pg.program.methods
      .registerIssuer(nameBytes("Playground Test"), pg.wallet.publicKey)
      .accounts({ issuer, authority: authority.publicKey, systemProgram: web3.SystemProgram.programId })
      .signers([authority])
      .rpc();
    const acc = await pg.program.account.issuer.fetch(issuer);
    assert(acc.writer.equals(pg.wallet.publicKey));
    assert(acc.active);
    assert.equal(acc.proofCount.toNumber(), 0);
  });

  it("numbers proofs and links them into a hash chain", async () => {
    await createProof(null, 0, 1);
    await createProof(null, 1, 2);
    const first = await pg.program.account.proofRecord.fetch(proofAt(0));
    const second = await pg.program.account.proofRecord.fetch(proofAt(1));
    assert.equal(first.sequence.toNumber(), 0);
    assert.deepEqual(first.prevRecordHash, bytes(32, 0));
    assert.deepEqual(second.prevRecordHash, first.recordHash);
    const ts = new Uint8Array(8);
    new DataView(ts.buffer).setBigInt64(0, BigInt(first.timestamp.toNumber()), true);
    const expected = await sha256([
      enc.encode("proofapi-v1"),
      issuer.toBuffer(),
      u64(0),
      Uint8Array.from(bytes(16, 1)),
      Uint8Array.from(bytes(32, 1)),
      Uint8Array.from(bytes(32, 2)),
      Uint8Array.from(bytes(32, 3)),
      Uint8Array.from(bytes(32, 0)),
      ts,
    ]);
    assert.deepEqual(Array.from(expected), first.recordHash);
    const acc = await pg.program.account.issuer.fetch(issuer);
    assert.equal(acc.proofCount.toNumber(), 2);
  });

  it("rejects a stranger's signature", async () => {
    const stranger = new web3.Keypair();
    await fund(stranger.publicKey, 0.01);
    try {
      await createProof(stranger, 2, 9);
      assert.fail("stranger was able to write");
    } catch (e) {
      assert.match(String(e), /UnauthorizedWriter|6001/);
    }
  });

  it("refuses writes while the issuer is inactive", async () => {
    await pg.program.methods.setActive(false).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    try {
      await createProof(null, 2, 3);
      assert.fail("inactive issuer was able to write");
    } catch (e) {
      assert.match(String(e), /IssuerInactive|6000/);
    }
    await pg.program.methods.setActive(true).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    await createProof(null, 2, 3);
  });

  it("rotates the writer key", async () => {
    const next = new web3.Keypair();
    await fund(next.publicKey, 0.01);
    await pg.program.methods.setWriter(next.publicKey).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    try {
      await createProof(null, 3, 4);
      assert.fail("old writer was able to write");
    } catch (e) {
      assert.match(String(e), /UnauthorizedWriter|6001/);
    }
    await createProof(next, 3, 4);
  });
});
```

- [ ] **Step 3: Write the deploy guide**

`programs/proof_registry/README.md`:
````markdown
# proof_registry — build, test, deploy (Solana Playground)

No local Rust is needed. Everything happens at https://beta.solpg.io.

1. Fund the Playground wallet: open Playground, click the wallet in the bottom-left to create it, copy its address, and request devnet SOL at https://faucet.solana.com (sign in with GitHub for 5 SOL). Deploying needs about 2 SOL.
2. Create a project: **Create a new project → Anchor (Rust)**, name `proof_registry`.
3. Replace `src/lib.rs` with this folder's `src/lib.rs`. Replace the test file under `tests/` with `tests/proof_registry.test.ts`.
4. Click **Build**. Playground writes the program id into `declare_id!`.
5. Click **Deploy** (cluster: devnet). Wait for "Deployment successful".
6. Click **Test**. All five tests must pass.
7. Copy the program id (Build & Deploy tab → Program ID) into the project `.env`:
   ```bash
   PROGRAM_ID=<program id>
   ```
8. Copy the program id into `declare_id!` in this repo's `src/lib.rs` too, and commit, so the source matches the deployment.
````

- [ ] **Step 4: Commit**

```bash
git add programs/proof_registry
git commit -m "feat: add proof_registry Anchor program with Playground tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Build, test and deploy (with the user)**

Follow `programs/proof_registry/README.md`. The user signs in on the faucet (GitHub) and presses Deploy; the agent guides step by step and never handles the user's credentials.
Expected: Playground shows 5 passing tests; `.env` contains `PROGRAM_ID`.

If a Playground test fails with an error about accounts that "cannot be passed" (Anchor 0.30 client), replace `.accounts(` with `.accountsStrict(` in the test file.

If the build fails because Playground's Anchor version does not support `ctx.bumps.issuer` (Anchor < 0.29), replace the two bump lines with `issuer.bump = *ctx.bumps.get("issuer").unwrap();` and `record.bump = *ctx.bumps.get("proof").unwrap();`.

---

### Task 6: Key and issuer scripts

**Files:**
- Create: `scripts/lib/env-file.ts`, `scripts/setup-keys.ts`, `scripts/register-issuer.ts`, `scripts/set-active.ts`, `scripts/chain-status.ts`
- Modify: `package.json` (scripts, `tsx` dev dependency), `vitest.config.ts` (include `scripts/**/*.test.ts` is not needed; tests stay in `tests/`)
- Test: `tests/env-file.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/env-file.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { upsertEnv } from "@/scripts/lib/env-file";

describe("upsertEnv", () => {
  it("replaces existing keys and appends new ones", () => {
    const text = 'CHAIN_MODE=memory\nPROGRAM_ID=\n# comment\n';
    expect(upsertEnv(text, { PROGRAM_ID: "abc", AUTHORITY_PUBKEY: "def" })).toBe(
      'CHAIN_MODE=memory\nPROGRAM_ID=abc\n# comment\nAUTHORITY_PUBKEY=def\n',
    );
  });

  it("fills defaults only when a key is missing or empty", () => {
    const text = "SOLANA_RPC_URL=https://my.rpc\nSOLANA_CLUSTER=\n";
    expect(upsertEnv(text, {}, { SOLANA_RPC_URL: "https://api.devnet.solana.com", SOLANA_CLUSTER: "devnet" })).toBe(
      "SOLANA_RPC_URL=https://my.rpc\nSOLANA_CLUSTER=devnet\n",
    );
  });

  it("does not touch commented-out keys", () => {
    expect(upsertEnv("# PROGRAM_ID=old\n", { PROGRAM_ID: "new" })).toBe("# PROGRAM_ID=old\nPROGRAM_ID=new\n");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/env-file.test.ts`
Expected: FAIL — cannot resolve `@/scripts/lib/env-file`.

- [ ] **Step 3: Implement the helper**

`scripts/lib/env-file.ts`:
```ts
/** Sets KEY=value lines in .env text. `set` always wins; `defaults` apply only to missing or empty keys. */
export function upsertEnv(text: string, set: Record<string, string>, defaults: Record<string, string> = {}): string {
  const lines = text.length ? text.replace(/\n$/, "").split("\n") : [];
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (!m) return line;
    const [, key, value] = m;
    seen.add(key);
    if (key in set) return `${key}=${set[key]}`;
    if (key in defaults && value.trim() === "") return `${key}=${defaults[key]}`;
    return line;
  });
  for (const [key, value] of Object.entries({ ...defaults, ...set })) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }
  return `${out.join("\n")}\n`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/env-file.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Install `tsx` and add npm scripts**

Run: `npm install -D tsx@4`

Add to `package.json` `"scripts"`:
```json
"setup": "tsx scripts/setup-keys.ts",
"register-issuer": "tsx scripts/register-issuer.ts",
"issuer:active": "tsx scripts/set-active.ts",
"chain:status": "tsx scripts/chain-status.ts",
"e2e:devnet": "tsx scripts/e2e-devnet.ts"
```

- [ ] **Step 6: Write the scripts**

`scripts/setup-keys.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Keypair } from "@solana/web3.js";
import { keypairFromJson } from "../lib/solana/anchor-config";
import { upsertEnv } from "./lib/env-file";

function loadOrCreate(path: string): { key: Keypair; created: boolean } {
  if (existsSync(path)) return { key: keypairFromJson(readFileSync(path, "utf8"), path), created: false };
  const key = Keypair.generate();
  writeFileSync(path, JSON.stringify(Array.from(key.secretKey)), { mode: 0o600 });
  return { key, created: true };
}

mkdirSync(".keys", { recursive: true });
const authority = loadOrCreate(".keys/authority.json");
const writer = loadOrCreate(".keys/writer.json");

const envText = existsSync(".env") ? readFileSync(".env", "utf8") : readFileSync(".env.example", "utf8");
writeFileSync(
  ".env",
  upsertEnv(
    envText,
    {
      AUTHORITY_PUBKEY: authority.key.publicKey.toBase58(),
      AUTHORITY_KEYPAIR_PATH: ".keys/authority.json",
      WRITER_KEYPAIR_PATH: ".keys/writer.json",
    },
    { SOLANA_RPC_URL: "https://api.devnet.solana.com", SOLANA_CLUSTER: "devnet" },
  ),
);

console.log(`Writer    (signs and pays for proofs): ${writer.key.publicKey.toBase58()}${writer.created ? "  [new]" : ""}`);
console.log(`Authority (manages the issuer):        ${authority.key.publicKey.toBase58()}${authority.created ? "  [new]" : ""}`);
console.log("\nKeys are in .keys/ (git-ignored). Never share these files.");
console.log("Next:");
console.log("  1. Get devnet SOL for the WRITER address at https://faucet.solana.com");
console.log("  2. Deploy the program: programs/proof_registry/README.md, then put PROGRAM_ID in .env");
console.log("  3. npm run register-issuer");
```

`scripts/register-issuer.ts`:
```ts
import { readFileSync } from "node:fs";
import { Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { keypairFromJson, loadAnchorConfig } from "../lib/solana/anchor-config";
import { registerIssuerIx } from "../lib/solana/encoding";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const authorityPath = process.env.AUTHORITY_KEYPAIR_PATH || ".keys/authority.json";
  const authority = keypairFromJson(readFileSync(authorityPath, "utf8"), authorityPath);
  if (!authority.publicKey.equals(cfg.authority)) throw new Error(`${authorityPath} does not match AUTHORITY_PUBKEY in .env`);

  const connection = new Connection(cfg.rpcUrl, "confirmed");
  const rpc = new ConnectionRpc(connection);
  const client = new AnchorChainClient({ rpc, ...cfg });

  const program = await connection.getAccountInfo(cfg.programId);
  if (!program?.executable) throw new Error(`No deployed program at ${cfg.programId.toBase58()}. Deploy it first (programs/proof_registry/README.md).`);

  const existing = await client.readIssuer();
  if (existing) {
    console.log(`Issuer already registered: ${client.issuerAddress()} ("${existing.name}", ${existing.proofCount} proofs)`);
    return;
  }

  const min = 0.01 * LAMPORTS_PER_SOL;
  if ((await connection.getBalance(authority.publicKey)) < min) {
    const writerBalance = await connection.getBalance(cfg.writer.publicKey);
    if (writerBalance < 0.05 * LAMPORTS_PER_SOL) {
      throw new Error(`The writer ${cfg.writer.publicKey.toBase58()} has no SOL. Get devnet SOL at https://faucet.solana.com and run again.`);
    }
    console.log("Moving 0.02 SOL from the writer to the authority to pay for registration...");
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: cfg.writer.publicKey, toPubkey: authority.publicKey, lamports: 0.02 * LAMPORTS_PER_SOL }),
    );
    await sendAndConfirmTransaction(connection, tx, [cfg.writer], { commitment: "confirmed" });
  }

  const name = process.env.ISSUER_NAME || "ProofAPI Demo";
  const signature = await rpc.send(registerIssuerIx(cfg.programId, authority.publicKey, cfg.writer.publicKey, name), [authority]);
  console.log(`Registered issuer "${name}" at ${client.issuerAddress()}`);
  console.log(client.explorerUrl(signature));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

`scripts/set-active.ts`:
```ts
import { readFileSync } from "node:fs";
import { Connection } from "@solana/web3.js";
import { keypairFromJson, loadAnchorConfig } from "../lib/solana/anchor-config";
import { setActiveIx } from "../lib/solana/encoding";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const arg = process.argv[2];
  if (arg !== "true" && arg !== "false") throw new Error("Usage: npm run issuer:active -- true|false");
  const cfg = loadAnchorConfig(process.env);
  const path = process.env.AUTHORITY_KEYPAIR_PATH || ".keys/authority.json";
  const authority = keypairFromJson(readFileSync(path, "utf8"), path);
  const rpc = new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed"));
  const signature = await rpc.send(setActiveIx(cfg.programId, authority.publicKey, arg === "true"), [authority]);
  console.log(`Issuer is now ${arg === "true" ? "active" : "inactive"}. Transaction: ${signature}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

`scripts/chain-status.ts`:
```ts
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { loadAnchorConfig } from "../lib/solana/anchor-config";
import { ConnectionRpc } from "../lib/solana/rpc";

process.loadEnvFile(".env");

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const connection = new Connection(cfg.rpcUrl, "confirmed");
  const client = new AnchorChainClient({ rpc: new ConnectionRpc(connection), ...cfg });
  const sol = async (k: typeof cfg.authority) => ((await connection.getBalance(k)) / LAMPORTS_PER_SOL).toFixed(4);
  const program = await connection.getAccountInfo(cfg.programId);
  const issuer = await client.readIssuer();
  console.log(`RPC:        ${cfg.rpcUrl} (${cfg.cluster})`);
  console.log(`Program:    ${cfg.programId.toBase58()} ${program?.executable ? "deployed" : "NOT DEPLOYED"}`);
  console.log(`Writer:     ${cfg.writer.publicKey.toBase58()} (${await sol(cfg.writer.publicKey)} SOL)`);
  console.log(`Authority:  ${cfg.authority.toBase58()} (${await sol(cfg.authority)} SOL)`);
  if (!issuer) {
    console.log(`Issuer:     ${client.issuerAddress()} NOT REGISTERED (npm run register-issuer)`);
    return;
  }
  console.log(`Issuer:     ${issuer.address} "${issuer.name}" ${issuer.active ? "active" : "INACTIVE"}`);
  console.log(`Proofs:     ${issuer.proofCount} (last record hash ${issuer.lastRecordHash.slice(0, 16)}…)`);
  console.log(`Writer set: ${issuer.writer === cfg.writer.publicKey.toBase58() ? "matches .env" : `MISMATCH (${issuer.writer})`}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 7: Check the offline script**

Run: `npm run setup && npx tsc --noEmit && git status --short`
Expected: two addresses printed; `.keys/` exists but does not appear in `git status`; `.env` does not appear either (both are git-ignored); typecheck clean.

- [ ] **Step 8: Commit**

```bash
git add scripts package.json package-lock.json tests/env-file.test.ts
git commit -m "feat: add key setup, issuer registration and chain status scripts" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Independent verifier `public/verifier.html`

One file, no dependencies, no requests to ProofAPI. The pure logic sits between `// CORE-START` and `// CORE-END` so the test can run it in Node.

**Files:**
- Create: `public/verifier.html`
- Test: `tests/verifier-html.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/verifier-html.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { fakeDevnet } from "./helpers/fake-program";

interface Core {
  base58Encode(bytes: Uint8Array): string;
  verifyPack(
    pack: unknown,
    account: { owner: string; data: Uint8Array } | null,
  ): Promise<{ status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN"; checks: { id: string; ok: boolean; detail: string }[] }>;
}

function loadCore(): Core {
  const html = readFileSync("public/verifier.html", "utf8");
  const code = html.slice(html.indexOf("// CORE-START"), html.indexOf("// CORE-END"));
  return new Function(`${code}\nreturn ProofVerifierCore;`)() as Core;
}

async function setup() {
  const net = await fakeDevnet();
  const chain = new AnchorChainClient({
    rpc: net.rpc,
    programId: net.programId,
    authority: net.authority.publicKey,
    writer: net.writer,
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  });
  const repo = new MemoryProofRepo();
  const service = createProofService({ repo, chain, ai: new MockAIProvider() });
  const { proof } = await service.createProof({ fileName: "c.txt", bytes: Buffer.from("Termination with notice. Payment in 60 days.") });
  const pack = await buildEvidencePack({ repo, chain }, proof.id);
  const raw = await net.rpc.getAccount(new PublicKey(pack.proof_account));
  const account = { owner: raw!.owner.toBase58(), data: new Uint8Array(raw!.data) };
  return { pack, account };
}

describe("verifier.html core", () => {
  const core = loadCore();

  it("encodes base58 like web3.js", () => {
    for (let i = 0; i < 20; i++) {
      const key = Keypair.generate().publicKey;
      expect(core.base58Encode(key.toBytes())).toBe(key.toBase58());
    }
    expect(core.base58Encode(new Uint8Array(32))).toBe(new PublicKey(new Uint8Array(32)).toBase58());
  });

  it("verifies a genuine evidence pack", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack(pack, account);
    expect(result.status).toBe("VERIFIED");
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails an edited output and names the check", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack({ ...pack, output_json: pack.output_json.replace("}", ',"x":1}') }, account);
    expect(result.status).toBe("FAILED");
    expect(result.checks.filter((c) => !c.ok).map((c) => c.id)).toEqual(["output"]);
  });

  it("fails an account owned by another program", async () => {
    const { pack, account } = await setup();
    const result = await core.verifyPack(pack, { ...account, owner: Keypair.generate().publicKey.toBase58() });
    expect(result.status).toBe("FAILED");
    expect(result.checks.find((c) => c.id === "owner")!.ok).toBe(false);
  });

  it("reports a missing account and rejects malformed packs", async () => {
    const { pack } = await setup();
    expect((await core.verifyPack(pack, null)).status).toBe("NOT_ON_CHAIN");
    const bad = await core.verifyPack({ version: "other" }, null);
    expect(bad.status).toBe("FAILED");
    expect(bad.checks[0]).toMatchObject({ id: "format", ok: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/verifier-html.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'public/verifier.html'`.

- [ ] **Step 3: Implement**

`public/verifier.html`:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ProofAPI Independent Verifier</title>
<style>
  :root { --bg: #f6f7f9; --card: #fff; --ink: #14161b; --muted: #5c6370; --line: #d9dde3; --ok: #0e6e4a; --bad: #b3261e; --accent: #2447d6; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f1115; --card: #171a20; --ink: #e8eaee; --muted: #9aa1ad; --line: #2b3038; --ok: #4cc38a; --bad: #ff7a70; --accent: #8ea2ff; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; padding: 32px 16px; }
  main { max-width: 760px; margin: 0 auto; display: grid; gap: 20px; }
  h1 { margin: 0; font-size: 28px; line-height: 1.2; }
  p { margin: 0; color: var(--muted); }
  form { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 20px; display: grid; gap: 14px; }
  label { font-weight: 600; font-size: 14px; display: grid; gap: 6px; }
  input[type=text] { font: 14px ui-monospace, Consolas, monospace; padding: 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--ink); }
  button { justify-self: start; font: 600 15px system-ui, sans-serif; padding: 11px 18px; border: 0; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }
  button:disabled { opacity: .6; cursor: default; }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  #verdict { font-size: 22px; font-weight: 700; }
  #verdict.ok { color: var(--ok); } #verdict.bad { color: var(--bad); }
  ul { list-style: none; margin: 0; padding: 0; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
  li { display: grid; grid-template-columns: 28px 1fr; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); }
  li:first-child { border-top: 0; }
  li .m { font-weight: 700; } li.ok .m { color: var(--ok); } li.bad .m { color: var(--bad); }
  li small { display: block; color: var(--muted); font: 12px ui-monospace, Consolas, monospace; overflow-wrap: anywhere; }
</style>
</head>
<body>
<main>
  <h1>Verify a ProofAPI evidence pack</h1>
  <p>This page checks the pack directly against Solana. It never contacts ProofAPI, so you can save it and run it anywhere.</p>
  <form id="form">
    <label>Evidence pack (.json)<input id="pack" type="file" accept=".json,application/json" required></label>
    <label>Solana RPC endpoint<input id="rpc" type="text" value="https://api.devnet.solana.com" required></label>
    <button id="run" type="submit">Verify</button>
  </form>
  <section aria-live="polite">
    <div id="verdict"></div>
    <ul id="checks" hidden></ul>
  </section>
  <p>What this proves: the input, AI output and metadata are byte-for-byte what the issuer recorded on Solana at the shown time. It does not prove the AI answer is correct.</p>
</main>
<script>
// CORE-START
const ProofVerifierCore = (() => {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const RECORD_DISC = "ed3b9baccc75572c";
  const RECORD_SIZE = 233;
  const enc = new TextEncoder();

  function base58Encode(bytes) {
    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    const digits = [];
    for (let i = zeros; i < bytes.length; i++) {
      let carry = bytes[i];
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry > 0) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }
    let out = "1".repeat(zeros);
    for (let k = digits.length - 1; k >= 0; k--) out += ALPHABET[digits[k]];
    return out;
  }

  const toHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  const fromHex = (h) => Uint8Array.from(h.match(/../g) || [], (x) => parseInt(x, 16));
  const fromBase64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  function concat(parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }

  async function sha256Hex(bytes) {
    return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
  }

  function uuidOf(b) {
    const h = toHex(b);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  function formatProblem(p) {
    if (!p || typeof p !== "object" || p.version !== "proofapi-evidence-v1") return "Not a proofapi-evidence-v1 file";
    for (const k of ["program_id", "issuer", "proof_account", "proof_id", "salt", "output_json", "metadata_json"]) {
      if (typeof p[k] !== "string" || !p[k]) return `Missing field ${k}`;
    }
    if (!/^[0-9a-f]{64}$/.test(p.salt)) return "Salt must be 64 hex characters";
    if (typeof p.sequence !== "number" || !p.input || typeof p.input.content_base64 !== "string") return "Missing sequence or input";
    return null;
  }

  async function verifyPack(pack, account) {
    const problem = formatProblem(pack);
    if (problem) return { status: "FAILED", checks: [{ id: "format", ok: false, detail: problem }] };
    const checks = [{ id: "format", ok: true, detail: "Evidence pack v1" }];
    if (!account) {
      checks.push({ id: "account", ok: false, detail: `No account at ${pack.proof_account}` });
      return { status: "NOT_ON_CHAIN", checks };
    }
    const d = account.data;
    const add = (id, ok, detail) => checks.push({ id, ok, detail });
    add("owner", account.owner === pack.program_id, `Account owner ${account.owner}`);
    const shapeOk = d.length >= RECORD_SIZE && toHex(d.subarray(0, 8)) === RECORD_DISC;
    add("type", shapeOk, shapeOk ? "ProofRecord account" : "Not a ProofRecord account");
    if (!shapeOk) return { status: "FAILED", checks };

    const seq = Number(new DataView(d.buffer, d.byteOffset + 40, 8).getBigUint64(0, true));
    const ts = Number(new DataView(d.buffer, d.byteOffset + 224, 8).getBigInt64(0, true));
    const onIssuer = base58Encode(d.subarray(8, 40));
    add("issuer", onIssuer === pack.issuer, `Issuer ${onIssuer}`);
    add("sequence", seq === pack.sequence, `Record #${seq}`);
    add("proof_id", uuidOf(d.subarray(48, 64)) === pack.proof_id, `Proof ${uuidOf(d.subarray(48, 64))}`);

    const salt = fromHex(pack.salt);
    const pairs = [
      ["input", fromBase64(pack.input.content_base64), 64],
      ["output", enc.encode(pack.output_json), 96],
      ["metadata", enc.encode(pack.metadata_json), 128],
    ];
    for (const [id, bytes, off] of pairs) {
      const now = await sha256Hex(concat([salt, bytes]));
      const onChain = toHex(d.subarray(off, off + 32));
      add(id, now === onChain, now === onChain ? `SHA-256 ${onChain}` : `on Solana ${onChain}, pack gives ${now}`);
    }

    const recordNow = await sha256Hex(concat([enc.encode("proofapi-v1"), d.subarray(8, 192), d.subarray(224, 232)]));
    add("record", recordNow === toHex(d.subarray(192, 224)), "Record hash recomputed from on-chain fields");
    add("time", true, `Recorded ${new Date(ts * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ")}`);

    return { status: checks.every((c) => c.ok) ? "VERIFIED" : "FAILED", checks };
  }

  async function fetchAccount(rpcUrl, address) {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getAccountInfo", params: [address, { encoding: "base64", commitment: "confirmed" }] }),
    });
    if (!res.ok) throw new Error(`RPC answered ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    const v = json.result && json.result.value;
    return v ? { owner: v.owner, data: fromBase64(v.data[0]) } : null;
  }

  return { base58Encode, verifyPack, fetchAccount };
})();
// CORE-END

const LABELS = { format: "Evidence pack", account: "Solana account", owner: "Owned by the ProofAPI program", type: "Account type", issuer: "Issuer", sequence: "Record number", proof_id: "Proof id", input: "Input unchanged", output: "AI output unchanged", metadata: "Metadata unchanged", record: "Record hash", time: "Time on Solana" };
const $ = (id) => document.getElementById(id);

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const verdict = $("verdict");
  const list = $("checks");
  $("run").disabled = true;
  verdict.className = "";
  verdict.textContent = "Checking against Solana…";
  list.hidden = true;
  try {
    const pack = JSON.parse(await $("pack").files[0].text());
    const rpc = $("rpc").value.trim() || pack.rpc_url;
    const account = pack && pack.proof_account ? await ProofVerifierCore.fetchAccount(rpc, pack.proof_account) : null;
    const result = await ProofVerifierCore.verifyPack(pack, account);
    verdict.textContent = { VERIFIED: "Verified", FAILED: "Verification failed", NOT_ON_CHAIN: "Not found on Solana" }[result.status];
    verdict.className = result.status === "VERIFIED" ? "ok" : "bad";
    list.replaceChildren(...result.checks.map((c) => {
      const li = document.createElement("li");
      li.className = c.ok ? "ok" : "bad";
      const mark = document.createElement("span");
      mark.className = "m";
      mark.textContent = c.ok ? "✓" : "✗";
      const body = document.createElement("div");
      body.textContent = LABELS[c.id] || c.id;
      const small = document.createElement("small");
      small.textContent = c.detail;
      body.append(small);
      li.append(mark, body);
      return li;
    }));
    list.hidden = false;
  } catch (err) {
    verdict.className = "bad";
    verdict.textContent = `Could not verify: ${err.message}`;
  } finally {
    $("run").disabled = false;
  }
});
</script>
</body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/verifier-html.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add public/verifier.html tests/verifier-html.test.ts
git commit -m "feat: add standalone verifier that checks evidence packs against Solana" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Devnet end-to-end script

**Files:**
- Create: `scripts/e2e-devnet.ts`
- Modify: `.gitignore` (add `evidence-*.json`)

- [ ] **Step 1: Write the script**

`scripts/e2e-devnet.ts`:
```ts
import { readFileSync, writeFileSync } from "node:fs";
import { Connection } from "@solana/web3.js";
import { MockAIProvider } from "../lib/ai-provider";
import { buildEvidencePack } from "../lib/evidence-pack";
import { auditHistory } from "../lib/history-audit";
import { createProofService } from "../lib/proof-service";
import { MemoryProofRepo } from "../lib/proof-repo-memory";
import { AnchorChainClient } from "../lib/solana/anchor-client";
import { loadAnchorConfig } from "../lib/solana/anchor-config";
import { ConnectionRpc } from "../lib/solana/rpc";
import { verifyProof } from "../lib/verifier";

process.loadEnvFile(".env");

function step(ok: boolean, text: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${text}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const cfg = loadAnchorConfig(process.env);
  const chain = new AnchorChainClient({ rpc: new ConnectionRpc(new Connection(cfg.rpcUrl, "confirmed")), ...cfg });
  const repo = new MemoryProofRepo();
  const deps = { repo, chain };
  const service = createProofService({ repo, chain, ai: new MockAIProvider() });

  const { proof, chainError } = await service.createProof({
    fileName: "sample-contract.txt",
    bytes: readFileSync("public/sample-contract.txt"),
  });
  step(proof.status === "ANCHORED", `recorded proof #${proof.sequence} ${chainError ?? ""}`);
  console.log(`      ${chain.explorerUrl(proof.solanaTransaction!)}`);

  step((await verifyProof(deps, proof.id)).status === "VERIFIED", "verifies against Solana");

  await service.tamperOutput(proof.id);
  const tampered = await verifyProof(deps, proof.id);
  step(tampered.status === "FAILED" && !tampered.checks.output.ok, "detects an edited AI output");
  await service.restoreOutput(proof.id);

  const pack = await buildEvidencePack(deps, proof.id);
  const file = `evidence-${proof.sequence}.json`;
  writeFileSync(file, JSON.stringify(pack, null, 2));
  step(true, `wrote ${file} for public/verifier.html`);

  const audit = await auditHistory(deps);
  const mine = audit.entries.find((e) => e.sequence === proof.sequence);
  step(mine?.status === "OK", `history audit: ${audit.total} records on Solana, this one OK`);
  console.log("      Earlier records show MISSING_IN_DATABASE here because this script uses a fresh in-memory database.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

Append to `.gitignore`:
```
evidence-*.json
```

- [ ] **Step 2: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add scripts/e2e-devnet.ts .gitignore
git commit -m "feat: add devnet end-to-end script" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Run on devnet (with the user)

Needs Task 5 deployed. The user does the faucet sign-in; the agent runs commands and reads output.

- [ ] **Step 1: Keys and funding**

Run: `npm run setup`
Then the user requests devnet SOL for the printed **writer** address at https://faucet.solana.com (GitHub sign-in, 5 SOL).
Run: `npm run chain:status`
Expected: `Program: … deployed`, writer balance > 0, `Issuer: … NOT REGISTERED`.

- [ ] **Step 2: Register the issuer**

Run: `npm run register-issuer`
Expected: `Registered issuer "ProofAPI Demo" at <address>` and an explorer link. `npm run chain:status` now shows `active`, `Proofs: 0`, `Writer set: matches .env`.

- [ ] **Step 3: End to end**

Run: `npm run e2e:devnet`
Expected: five `PASS` lines and an `evidence-0.json` file. Open the explorer link and confirm the transaction called our program.

- [ ] **Step 4: Independent verifier**

Open `public/verifier.html` directly from disk in a browser, choose `evidence-0.json`, click Verify.
Expected: "Verified" and all checks green. Then edit one character of `output_json` in a copy of the file and verify again.
Expected: "Verification failed" with only "AI output unchanged" red.

- [ ] **Step 5: App in anchor mode**

Set `CHAIN_MODE=anchor` in `.env`, run `npm run db:reset && npm run dev`, create a proof through the API:
```bash
curl -s -F file=@public/sample-contract.txt http://localhost:3000/api/proofs
```
Expected: JSON with `"status":"ANCHORED"` and a devnet `explorerUrl`.

- [ ] **Step 6: Record the deployment**

Write the program id, issuer address and first explorer link into `programs/proof_registry/README.md` under a new "Devnet deployment" heading, update `declare_id!` in `src/lib.rs`, and commit:
```bash
git add programs/proof_registry
git commit -m "docs: record devnet deployment of proof_registry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope for Plan B

- UI changes (Plan A Tasks 12–17, to be redone on the design system later). The API already returns `explorerUrl`, `accountUrl` and evidence packs, so the UI only needs to show them.
- Public hosting (Vercel + Neon Postgres) — a separate small plan after the UI.
- Backlog from spec §14: zkTLS, eIDAS timestamps, batching, SDK, real AI provider.
