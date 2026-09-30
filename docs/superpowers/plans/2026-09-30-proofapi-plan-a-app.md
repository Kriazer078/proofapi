# ProofAPI Plan A — App & UX (local simulation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete ProofAPI web app (create proofs, verify, history audit, evidence pack, demo attacks) with a polished, intuitive UX, running against an in-memory simulation of the Solana program.

**Architecture:** Next.js 15 App Router app. Pure domain logic lives in `lib/` behind small interfaces (`ChainClient`, `ProofRepo`, `AIProvider`) so it is unit-tested with in-memory implementations. `InMemoryChainClient` mirrors the on-chain rules from spec v2 §4 exactly (issuer, sequence numbers, hash chain, record hash). Plan B swaps in the real Solana client without touching UI or services.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, Prisma 6 + SQLite, `@solana/web3.js` 1.x (only `PublicKey` here), `pdf-parse` 1.1.1, Vitest 3.

**Specs:** [spec v2](../specs/2026-09-30-proofapi-mvp-design.md), [UX design](../specs/2026-09-30-proofapi-ux-design.md).

**Conventions:**
- Shell commands are for Git Bash in the project root (`C:\Users\User.DESKTOP-T27SALG\Downloads\project\ProofAPI`).
- Files inside `lib/` import each other with relative paths; `app/`, `components/` and `tests/` use the `@/` alias.
- Commit after every task with the attribution trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## File map

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts
.env.example, .gitattributes, .gitignore (update)
types/pdf-parse.d.ts
prisma/schema.prisma
public/sample-contract.txt

lib/errors.ts              error classes mapped to HTTP codes
lib/hashing.ts             sha256, salt, salted hash, canonical JSON
lib/ai-provider.ts         AIProvider interface + MockAIProvider
lib/extract-text.ts        PDF/TXT text extraction + validation
lib/solana/record-hash.ts  ZERO_HASH, uuid<->bytes, computeRecordHash (mirrors contract)
lib/solana/types.ts        ChainClient interface and chain data types
lib/solana/memory-client.ts InMemoryChainClient (same rules as the program)
lib/solana/index.ts        getChainClient() factory
lib/proof-repo.ts          ProofRow types + ProofRepo interface
lib/proof-repo-memory.ts   MemoryProofRepo (tests)
lib/proof-repo-prisma.ts   PrismaProofRepo
lib/db.ts                  Prisma client singleton
lib/proof-hashes.ts        currentHashes(row)
lib/proof-service.ts       create / hash-only / retry / tamper / restore / delete
lib/verifier.ts            verifyProof()
lib/verification-text.ts   plain-language verdict texts
lib/history-audit.ts       auditHistory()
lib/evidence-pack.ts       buildEvidencePack()
lib/public-proof.ts        PublicProof view model
lib/api.ts                 errorResponse()
lib/services.ts            wiring for route handlers
lib/config.ts              chain mode for UI
lib/format.ts              date/hash/bytes formatting

app/layout.tsx, app/globals.css, app/page.tsx
app/new/page.tsx
app/proof/[id]/page.tsx, app/proof/[id]/proof-view.tsx
app/history/page.tsx, app/history/history-view.tsx
app/api/proofs/route.ts
app/api/proofs/hashes/route.ts
app/api/proofs/[id]/route.ts
app/api/proofs/[id]/verify/route.ts
app/api/proofs/[id]/evidence/route.ts
app/api/proofs/[id]/retry/route.ts
app/api/proofs/[id]/tamper/route.ts
app/api/proofs/[id]/restore/route.ts
app/api/proofs/[id]/delete/route.ts
app/api/history/audit/route.ts

components/ui/button.tsx, card.tsx, badge.tsx, copy-button.tsx
components/nav-bar.tsx, dropzone.tsx, step-timeline.tsx, risk-score.tsx
components/verdict-banner.tsx, checks-list.tsx, demo-panel.tsx

tests/*.test.ts
.claude/launch.json
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `.gitattributes`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- Modify: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "proofapi",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:reset": "prisma db push --force-reset"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install next@15 react@19 react-dom@19 @prisma/client@6 @solana/web3.js@1 pdf-parse@1.1.1
npm install -D typescript@5 @types/node@22 @types/react@19 @types/react-dom@19 tailwindcss@4 @tailwindcss/postcss@4 prisma@6 vitest@3
```
Expected: both finish without `ERR!`. Peer-dependency warnings are acceptable.

- [ ] **Step 3: Write config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "programs"]
}
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
```

`postcss.config.mjs`:
```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

`vitest.config.ts`:
```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

`.env.example`:
```bash
# memory = local simulation of the Solana program; anchor = real program on devnet (Plan B)
CHAIN_MODE=memory
ISSUER_NAME="ProofAPI Demo"
DATABASE_URL="file:./dev.db"
```

`.gitattributes`:
```
* text=auto eol=lf
```

Append to `.gitignore`:
```
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 4: Minimal app shell**

`app/globals.css`:
```css
@import "tailwindcss";
```

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofAPI — Git history for AI",
  description: "Tamper-evident, independently verifiable records of what your AI received and returned.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
```

`app/page.tsx`:
```tsx
export default function HomePage() {
  return <main className="p-10">ProofAPI</main>;
}
```

- [ ] **Step 5: Verify the scaffold**

Run: `cp .env.example .env && npx tsc --noEmit && npx vitest run --passWithNoTests && npm run build`
Expected: typecheck passes, Vitest prints "No test files found, exiting with code 0", build ends with "Compiled successfully".

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs vitest.config.ts .env.example .gitattributes .gitignore app
git commit -m "chore: scaffold Next.js app with Tailwind, Prisma and Vitest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Errors and hashing

**Files:**
- Create: `lib/errors.ts`, `lib/hashing.ts`
- Test: `tests/hashing.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/hashing.test.ts`:
```ts
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalJson, newSalt, saltedHash, sha256Hex } from "@/lib/hashing";

const SALT = "00".repeat(32);

describe("sha256Hex", () => {
  it("matches the known SHA-256 of 'abc'", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("changes completely when one character changes", () => {
    expect(sha256Hex("Risk Score: 31")).not.toBe(sha256Hex("Risk Score: 5"));
  });
});

describe("saltedHash", () => {
  it("hashes salt bytes followed by data bytes", () => {
    const expected = createHash("sha256").update(Buffer.concat([Buffer.from(SALT, "hex"), Buffer.from("abc")])).digest("hex");
    expect(saltedHash(SALT, "abc")).toBe(expected);
    expect(saltedHash(SALT, Buffer.from("abc"))).toBe(expected);
  });
  it("gives a different hash for a different salt", () => {
    expect(saltedHash(SALT, "abc")).not.toBe(saltedHash("11".repeat(32), "abc"));
  });
  it("rejects a malformed salt", () => {
    expect(() => saltedHash("xyz", "abc")).toThrow("Salt must be 64 lowercase hex characters");
  });
});

describe("newSalt", () => {
  it("returns 32 random bytes as hex", () => {
    const a = newSalt();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(newSalt()).not.toBe(a);
  });
});

describe("canonicalJson", () => {
  it("does not depend on key order", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalJson({ a: { c: 3, d: 2 }, b: 1 }));
  });
  it("produces compact sorted output and drops undefined", () => {
    expect(canonicalJson({ b: [2, { z: 1, y: 0 }], a: "x", u: undefined })).toBe('{"a":"x","b":[2,{"y":0,"z":1}]}');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hashing.test.ts`
Expected: FAIL — cannot resolve `@/lib/hashing`.

- [ ] **Step 3: Implement**

`lib/errors.ts`:
```ts
/** Invalid input from the caller. Maps to HTTP 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Requested entity does not exist. Maps to HTTP 404. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The chain rejected or could not process a write. */
export class ChainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChainError";
  }
}
```

`lib/hashing.ts`:
```ts
import { createHash, randomBytes } from "node:crypto";

const SALT_RE = /^[0-9a-f]{64}$/;

export function sha256Hex(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function newSalt(): string {
  return randomBytes(32).toString("hex");
}

/** SHA256(salt ‖ data). Salt defeats brute-forcing short, predictable AI outputs. */
export function saltedHash(saltHex: string, data: string | Uint8Array): string {
  if (!SALT_RE.test(saltHex)) throw new Error("Salt must be 64 lowercase hex characters");
  const bytes = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  return createHash("sha256").update(Buffer.concat([Buffer.from(saltHex, "hex"), bytes])).digest("hex");
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortKeys(v);
    }
    return out;
  }
  return value;
}

/** JSON with recursively sorted keys and no whitespace, so equal objects hash equally. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hashing.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/errors.ts lib/hashing.ts tests/hashing.test.ts
git commit -m "feat: add error types and salted hashing" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Mock AI provider and sample contract

**Files:**
- Create: `lib/ai-provider.ts`, `public/sample-contract.txt`
- Test: `tests/ai-provider.test.ts`

- [ ] **Step 1: Create the sample contract**

`public/sample-contract.txt` (the mock scores it 31: termination 8 + liability 13 + payment 10; keep it free of the words penalty, indemnify, confidential, renew):
```
SERVICE AGREEMENT

This Service Agreement is made between Northwind Analytics LLC ("Provider") and Blue Harbor Logistics Inc. ("Client").

1. Services
Provider will deliver monthly data analysis reports to Client.

2. Payment
Client shall make payment within 60 days of receiving each report. Late payment accrues interest of 2% per month.

3. Termination
Either party may end this agreement with 7 days written notice. Provider may suspend the services immediately upon termination.

4. Liability
Provider's total liability under this agreement is limited to USD 500, regardless of the damages suffered by Client.

5. Governing Law
This agreement is governed by the laws of the State of Delaware.
```

- [ ] **Step 2: Write the failing test**

`tests/ai-provider.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";

const ai = new MockAIProvider();

describe("MockAIProvider", () => {
  it("scores the sample contract at 31 with three issues", async () => {
    const text = readFileSync("public/sample-contract.txt", "utf8");
    const result = await ai.analyze(text);
    expect(result.riskScore).toBe(31);
    expect(result.issues).toEqual(["Termination clause", "Liability risk", "Payment condition"]);
  });
  it("is deterministic", async () => {
    expect(await ai.analyze("termination and liability")).toEqual(await ai.analyze("termination and liability"));
  });
  it("returns zero risk for neutral text", async () => {
    const result = await ai.analyze("Hello world");
    expect(result.riskScore).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.summary).toBe("No notable risk factors found.");
  });
  it("adds a capped length factor", async () => {
    const text = "termination liability payment penalty indemnification confidential auto-renew ".repeat(500);
    expect((await ai.analyze(text)).riskScore).toBe(81);
  });
  it("identifies itself as a mock", () => {
    expect(ai.name).toBe("mock");
    expect(ai.model).toBe("proofapi-mock-v1");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/ai-provider.test.ts`
Expected: FAIL — cannot resolve `@/lib/ai-provider`.

- [ ] **Step 4: Implement**

`lib/ai-provider.ts`:
```ts
export interface AnalysisResult {
  riskScore: number; // 0..100
  issues: string[];
  summary: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  analyze(text: string): Promise<AnalysisResult>;
}

const RULES: { pattern: RegExp; issue: string; weight: number }[] = [
  { pattern: /terminat/i, issue: "Termination clause", weight: 8 },
  { pattern: /liabilit/i, issue: "Liability risk", weight: 13 },
  { pattern: /payment|invoice/i, issue: "Payment condition", weight: 10 },
  { pattern: /penalt/i, issue: "Penalty clause", weight: 12 },
  { pattern: /indemnif/i, issue: "Indemnification obligation", weight: 15 },
  { pattern: /confidential/i, issue: "Confidentiality obligation", weight: 4 },
  { pattern: /auto(matic)?(ally)?[- ]?renew/i, issue: "Automatic renewal", weight: 9 },
];

/** Deterministic keyword-based stand-in for a real model. Real providers plug in behind AIProvider later. */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "proofapi-mock-v1";

  async analyze(text: string): Promise<AnalysisResult> {
    const found = RULES.filter((rule) => rule.pattern.test(text));
    const lengthFactor = Math.min(10, Math.floor(text.length / 2000));
    const riskScore = Math.min(100, found.reduce((sum, rule) => sum + rule.weight, 0) + lengthFactor);
    return {
      riskScore,
      issues: found.map((rule) => rule.issue),
      summary: found.length ? `Found ${found.length} risk factor(s).` : "No notable risk factors found.",
    };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/ai-provider.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/ai-provider.ts public/sample-contract.txt tests/ai-provider.test.ts
git commit -m "feat: add deterministic mock AI provider and sample contract" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Text extraction

**Files:**
- Create: `lib/extract-text.ts`, `types/pdf-parse.d.ts`
- Test: `tests/extract-text.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/extract-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { MAX_FILE_BYTES, extractText } from "@/lib/extract-text";

describe("extractText", () => {
  it("reads UTF-8 text files and trims them", async () => {
    expect(await extractText("a.txt", Buffer.from("  Hello  "))).toBe("Hello");
  });
  it("rejects unsupported file types", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toThrow("Unsupported file type");
  });
  it("rejects files without text", async () => {
    await expect(extractText("a.txt", Buffer.from("   "))).rejects.toThrow("No text found in document");
  });
  it("rejects files over 5 MB", async () => {
    await expect(extractText("a.txt", Buffer.alloc(MAX_FILE_BYTES + 1, 97))).rejects.toThrow("larger than 5 MB");
  });
  it("throws ValidationError so the API can answer 400", async () => {
    await expect(extractText("a.docx", Buffer.from("x"))).rejects.toBeInstanceOf(ValidationError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/extract-text.test.ts`
Expected: FAIL — cannot resolve `@/lib/extract-text`.

- [ ] **Step 3: Implement**

`types/pdf-parse.d.ts`:
```ts
declare module "pdf-parse/lib/pdf-parse.js" {
  const pdf: (data: Buffer) => Promise<{ text: string }>;
  export default pdf;
}
```

`lib/extract-text.ts`:
```ts
import { ValidationError } from "./errors";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function extractText(fileName: string, bytes: Buffer): Promise<string> {
  if (bytes.length > MAX_FILE_BYTES) throw new ValidationError("File is larger than 5 MB");
  const lower = fileName.toLowerCase();
  let text: string;
  if (lower.endsWith(".txt") || lower.endsWith(".md")) {
    text = bytes.toString("utf8");
  } else if (lower.endsWith(".pdf")) {
    // Import the inner module: the package entry runs debug code when bundled.
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    text = (await pdf(bytes)).text;
  } else {
    throw new ValidationError("Unsupported file type. Upload a .pdf or .txt file");
  }
  text = text.trim();
  if (!text) throw new ValidationError("No text found in document");
  return text;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/extract-text.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/extract-text.ts types/pdf-parse.d.ts tests/extract-text.test.ts
git commit -m "feat: add PDF/TXT text extraction with validation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Record hash (mirror of the on-chain formula)

**Files:**
- Create: `lib/solana/record-hash.ts`
- Test: `tests/record-hash.test.ts`

The formula must stay byte-identical to the program in Plan B (spec v2 §4):
`SHA256("proofapi-v1" ‖ issuer(32) ‖ sequence(u64 LE) ‖ proof_id(16) ‖ input ‖ output ‖ metadata ‖ prev ‖ timestamp(i64 LE))`.

- [ ] **Step 1: Write the failing test**

`tests/record-hash.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/record-hash.test.ts`
Expected: FAIL — cannot resolve `@/lib/solana/record-hash`.

- [ ] **Step 3: Implement**

`lib/solana/record-hash.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/record-hash.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/solana/record-hash.ts tests/record-hash.test.ts
git commit -m "feat: add record hash mirroring the on-chain formula" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Chain types and in-memory chain

**Files:**
- Create: `lib/solana/types.ts`, `lib/solana/memory-client.ts`
- Test: `tests/memory-client.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/memory-client.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ChainError } from "@/lib/errors";
import { InMemoryChainClient } from "@/lib/solana/memory-client";
import { ZERO_HASH, computeRecordHash } from "@/lib/solana/record-hash";

const input = (n: number) => ({
  proofId: `123e4567-e89b-42d3-a456-42661417400${n}`,
  inputHash: "aa".repeat(32),
  outputHash: "bb".repeat(32),
  metadataHash: "cc".repeat(32),
});

function newChain() {
  let t = 1790000000;
  return new InMemoryChainClient({ name: "Test", clock: () => t++ });
}

describe("InMemoryChainClient", () => {
  it("registers the issuer once", async () => {
    const chain = newChain();
    const a = await chain.ensureIssuer();
    const b = await chain.ensureIssuer();
    expect(a).toEqual(b);
    expect(a).toMatchObject({ name: "Test", active: true, proofCount: 0, lastRecordHash: ZERO_HASH });
  });

  it("numbers records and links them into a hash chain", async () => {
    const chain = newChain();
    const first = await chain.anchorProof(input(1));
    const second = await chain.anchorProof(input(2));
    expect(first.sequence).toBe(0);
    expect(first.prevRecordHash).toBe(ZERO_HASH);
    expect(second.sequence).toBe(1);
    expect(second.prevRecordHash).toBe(first.recordHash);
    const issuer = await chain.readIssuer();
    expect(issuer).toMatchObject({ proofCount: 2, lastRecordHash: second.recordHash });
  });

  it("computes record hashes with the shared formula", async () => {
    const chain = newChain();
    const r = await chain.anchorProof(input(1));
    const record = await chain.readProofAccount(r.account);
    expect(record).not.toBeNull();
    expect(computeRecordHash(record!)).toBe(r.recordHash);
    expect(await chain.readProofBySequence(0)).toEqual(record);
  });

  it("refuses writes from an inactive issuer", async () => {
    const chain = newChain();
    await chain.ensureIssuer();
    chain.setActive(false);
    await expect(chain.anchorProof(input(1))).rejects.toBeInstanceOf(ChainError);
  });

  it("can simulate one network failure", async () => {
    const chain = newChain();
    chain.failNextAnchor = new Error("RPC down");
    await expect(chain.anchorProof(input(1))).rejects.toThrow("RPC down");
    await expect(chain.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
  });

  it("returns null for unknown records and has no explorer links", async () => {
    const chain = newChain();
    expect(await chain.readProofBySequence(0)).toBeNull();
    expect(await chain.readProofAccount("memory:9")).toBeNull();
    expect(chain.explorerUrl("sig")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/memory-client.test.ts`
Expected: FAIL — cannot resolve `@/lib/solana/memory-client`.

- [ ] **Step 3: Implement**

`lib/solana/types.ts`:
```ts
export interface IssuerState {
  address: string;
  writer: string;
  name: string;
  active: boolean;
  proofCount: number;
  lastRecordHash: string;
  createdAt: number;
}

export interface ChainProofRecord {
  account: string;
  issuer: string;
  sequence: number;
  proofId: string;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  prevRecordHash: string;
  recordHash: string;
  timestamp: number;
}

export interface AnchorInput {
  proofId: string;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
}

export interface AnchorResult {
  signature: string;
  account: string;
  sequence: number;
  recordHash: string;
  prevRecordHash: string;
  timestamp: number;
}

export interface EvidenceContext {
  cluster: string;
  rpcUrl: string | null;
  programId: string | null;
}

/** One client is bound to our issuer. Plan B adds the real Solana implementation. */
export interface ChainClient {
  readonly mode: "memory" | "anchor";
  issuerAddress(): string;
  ensureIssuer(): Promise<IssuerState>;
  readIssuer(): Promise<IssuerState | null>;
  anchorProof(p: AnchorInput): Promise<AnchorResult>;
  readProofBySequence(sequence: number): Promise<ChainProofRecord | null>;
  readProofAccount(account: string): Promise<ChainProofRecord | null>;
  explorerUrl(signature: string): string | null;
  accountUrl(account: string): string | null;
  evidenceContext(): EvidenceContext;
}
```

`lib/solana/memory-client.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/memory-client.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/solana/types.ts lib/solana/memory-client.ts tests/memory-client.test.ts
git commit -m "feat: add chain client interface and in-memory chain" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Proof storage

**Files:**
- Create: `lib/proof-repo.ts`, `lib/proof-repo-memory.ts`, `lib/proof-repo-prisma.ts`, `lib/db.ts`, `prisma/schema.prisma`

The memory repo is covered by the service tests in Task 8; the Prisma repo is exercised by the API smoke test in Task 11.

- [ ] **Step 1: Write the repo interface**

`lib/proof-repo.ts`:
```ts
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
```

- [ ] **Step 2: Write the memory repo**

`lib/proof-repo-memory.ts`:
```ts
import { NotFoundError } from "./errors";
import type { ProofPatch, ProofRepo, ProofRow } from "./proof-repo";

export class MemoryProofRepo implements ProofRepo {
  private rows = new Map<string, ProofRow>();

  async create(row: ProofRow): Promise<void> {
    if (this.rows.has(row.id)) throw new Error(`Proof ${row.id} already exists`);
    this.rows.set(row.id, { ...row });
  }

  async get(id: string): Promise<ProofRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async update(id: string, patch: ProofPatch): Promise<void> {
    const row = this.rows.get(id);
    if (!row) throw new NotFoundError(`Proof ${id} not found`);
    this.rows.set(id, { ...row, ...patch });
  }

  async delete(id: string): Promise<void> {
    if (!this.rows.delete(id)) throw new NotFoundError(`Proof ${id} not found`);
  }

  async list(): Promise<ProofRow[]> {
    return [...this.rows.values()].map((r) => ({ ...r })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
```

- [ ] **Step 3: Write the Prisma schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Proof {
  id                 String   @id
  mode               String
  salt               String?
  inputBlob          Bytes?
  inputFileName      String?
  inputText          String?
  outputJson         String?
  metadataJson       String?
  inputHash          String
  outputHash         String
  metadataHash       String
  provider           String?
  model              String?
  status             String
  sequence           Int?
  account            String?
  solanaTransaction  String?
  recordHash         String?
  prevRecordHash     String?
  chainTimestamp     Int?
  agentId            String?
  toolName           String?
  actionType         String?
  externalApi        String?
  parentProofId      String?
  tamperedBackupJson String?
  createdAt          DateTime
}
```

Run: `npm run db:push`
Expected: "Your database is now in sync with your Prisma schema" and "Generated Prisma Client".

- [ ] **Step 4: Write the Prisma repo and client singleton**

`lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const g = globalThis as { __prisma?: PrismaClient };

export const prisma = g.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__prisma = prisma;
```

`lib/proof-repo-prisma.ts`:
```ts
import type { Prisma, PrismaClient, Proof } from "@prisma/client";
import type { ProofMode, ProofPatch, ProofRepo, ProofRow, ProofStatus } from "./proof-repo";

function toRow(p: Proof): ProofRow {
  return {
    ...p,
    mode: p.mode as ProofMode,
    status: p.status as ProofStatus,
    inputBlob: p.inputBlob ? Buffer.from(p.inputBlob) : null,
  };
}

function toData(patch: ProofPatch) {
  const { inputBlob, ...rest } = patch;
  if (inputBlob === undefined) return rest;
  return { ...rest, inputBlob: inputBlob === null ? null : new Uint8Array(inputBlob) };
}

export class PrismaProofRepo implements ProofRepo {
  constructor(private readonly db: PrismaClient) {}

  async create(row: ProofRow): Promise<void> {
    const data = { ...toData(row), id: row.id, createdAt: row.createdAt } as Prisma.ProofUncheckedCreateInput;
    await this.db.proof.create({ data });
  }

  async get(id: string): Promise<ProofRow | null> {
    const p = await this.db.proof.findUnique({ where: { id } });
    return p ? toRow(p) : null;
  }

  async update(id: string, patch: ProofPatch): Promise<void> {
    await this.db.proof.update({ where: { id }, data: toData(patch) as Prisma.ProofUncheckedUpdateInput });
  }

  async delete(id: string): Promise<void> {
    await this.db.proof.delete({ where: { id } });
  }

  async list(): Promise<ProofRow[]> {
    const rows = await this.db.proof.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toRow);
  }
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/proof-repo.ts lib/proof-repo-memory.ts lib/proof-repo-prisma.ts lib/db.ts prisma/schema.prisma
git commit -m "feat: add proof storage (Prisma + in-memory)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Proof service

**Files:**
- Create: `lib/proof-hashes.ts`, `lib/proof-service.ts`
- Test: `tests/proof-service.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/proof-service.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { saltedHash } from "@/lib/hashing";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const SALT = "5a".repeat(32);
const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

function setup() {
  let n = 0;
  let t = 1790000000;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient({ clock: () => t++ });
  const service = createProofService({
    repo,
    chain,
    ai: new MockAIProvider(),
    now: () => new Date("2026-09-30T12:00:00.000Z"),
    newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}`,
    newSalt: () => SALT,
  });
  return { repo, chain, service };
}
const ID0 = "123e4567-e89b-42d3-a456-426614174000";
const ID1 = "123e4567-e89b-42d3-a456-426614174001";

describe("createProof", () => {
  it("analyzes, salts, hashes and anchors a document", async () => {
    const { chain, service } = setup();
    const { proof, chainError } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(chainError).toBeNull();
    expect(proof).toMatchObject({ id: ID0, mode: "full", status: "ANCHORED", sequence: 0, salt: SALT });
    expect(proof.inputHash).toBe(saltedHash(SALT, CONTRACT));
    expect(proof.outputHash).toBe(saltedHash(SALT, proof.outputJson!));
    expect(proof.metadataHash).toBe(saltedHash(SALT, proof.metadataJson!));
    expect(JSON.parse(proof.metadataJson!)).toEqual({
      created_at: "2026-09-30T12:00:00.000Z",
      file_name: "c.txt",
      model: "proofapi-mock-v1",
      model_attestation: "declared",
      provider: "mock",
    });
    expect(await chain.readProofBySequence(0)).toMatchObject({ proofId: ID0, inputHash: proof.inputHash });
  });

  it("links consecutive proofs in the issuer history", async () => {
    const { service } = setup();
    const a = await service.createProof({ fileName: "a.txt", bytes: CONTRACT });
    const b = await service.createProof({ fileName: "b.txt", bytes: CONTRACT });
    expect(b.proof.sequence).toBe(1);
    expect(b.proof.prevRecordHash).toBe(a.proof.recordHash);
  });

  it("stores agent fields in metadata", async () => {
    const { service } = setup();
    const { proof } = await service.createProof({
      fileName: "c.txt",
      bytes: CONTRACT,
      agent: { agentId: "agent-7", toolName: "crm.update", actionType: "update", externalApi: "https://api.example.com", parentProofId: ID1 },
    });
    expect(JSON.parse(proof.metadataJson!)).toMatchObject({
      agent_id: "agent-7",
      tool_name: "crm.update",
      action_type: "update",
      external_api: "https://api.example.com",
      parent_proof_id: ID1,
    });
    expect(proof.agentId).toBe("agent-7");
  });
});

describe("anchoring failures", () => {
  it("keeps the proof pending and retries later", async () => {
    const { chain, service } = setup();
    chain.failNextAnchor = new Error("RPC down");
    const first = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(first.chainError).toBe("RPC down");
    expect(first.proof.status).toBe("PENDING_CHAIN");
    const second = await service.retryAnchoring(ID0);
    expect(second.chainError).toBeNull();
    expect(second.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
  });

  it("adopts a record that reached the chain even if the response was lost", async () => {
    const { repo, chain, service } = setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await repo.update(ID0, { status: "PENDING_CHAIN", sequence: null, account: null, recordHash: null });
    const retried = await service.retryAnchoring(ID0);
    expect(retried.proof).toMatchObject({ status: "ANCHORED", sequence: 0 });
    expect((await chain.readIssuer())!.proofCount).toBe(1);
  });
});

describe("createHashOnlyProof", () => {
  it("anchors caller-supplied hashes without storing content", async () => {
    const { service } = setup();
    const { proof } = await service.createHashOnlyProof({ inputHash: "AA".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    expect(proof).toMatchObject({ mode: "hashes", status: "ANCHORED", salt: null, inputBlob: null, inputHash: "aa".repeat(32) });
  });
  it("rejects malformed hashes", async () => {
    const { service } = setup();
    await expect(service.createHashOnlyProof({ inputHash: "x", outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("demo actions", () => {
  it("tampers with and restores the AI output", async () => {
    const { service } = setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const tampered = await service.tamperOutput(ID0);
    expect(JSON.parse(tampered.outputJson!).riskScore).toBe(5);
    expect(tampered.tamperedBackupJson).toBe(proof.outputJson);
    const restored = await service.restoreOutput(ID0);
    expect(restored.outputJson).toBe(proof.outputJson);
    expect(restored.tamperedBackupJson).toBeNull();
  });
  it("deletes a proof from the database and reports its sequence", async () => {
    const { repo, service } = setup();
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect(await service.deleteProof(ID0)).toEqual({ sequence: 0 });
    expect(await repo.get(ID0)).toBeNull();
  });
  it("throws NotFoundError for unknown ids", async () => {
    const { service } = setup();
    await expect(service.retryAnchoring("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/proof-service.test.ts`
Expected: FAIL — cannot resolve `@/lib/proof-service`.

- [ ] **Step 3: Implement**

`lib/proof-hashes.ts`:
```ts
import { saltedHash } from "./hashing";
import type { ProofRow } from "./proof-repo";

export interface ProofHashes {
  input: string;
  output: string;
  metadata: string;
}

/** Hashes recomputed from stored content; hash-only proofs return their stored hashes. */
export function currentHashes(row: ProofRow): ProofHashes {
  if (row.mode === "hashes" || !row.salt || !row.inputBlob || row.outputJson === null || row.metadataJson === null) {
    return { input: row.inputHash, output: row.outputHash, metadata: row.metadataHash };
  }
  return {
    input: saltedHash(row.salt, row.inputBlob),
    output: saltedHash(row.salt, row.outputJson),
    metadata: saltedHash(row.salt, row.metadataJson),
  };
}
```

`lib/proof-service.ts`:
```ts
import { randomUUID } from "node:crypto";
import type { AIProvider, AnalysisResult } from "./ai-provider";
import { NotFoundError, ValidationError } from "./errors";
import { extractText } from "./extract-text";
import { canonicalJson, newSalt, saltedHash } from "./hashing";
import type { ProofRepo, ProofRow } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface AgentFields {
  agentId?: string;
  toolName?: string;
  actionType?: string;
  externalApi?: string;
  parentProofId?: string;
}

export interface ProofServiceDeps {
  repo: ProofRepo;
  chain: ChainClient;
  ai: AIProvider;
  now?: () => Date;
  newId?: () => string;
  newSalt?: () => string;
}

export interface ProofOutcome {
  proof: ProofRow;
  chainError: string | null;
}

const HEX64 = /^[0-9a-f]{64}$/;
const RETRY_LOOKBACK = 20;

function emptyRow(id: string, createdAt: Date): Omit<ProofRow, "mode" | "inputHash" | "outputHash" | "metadataHash"> {
  return {
    id,
    salt: null,
    inputBlob: null,
    inputFileName: null,
    inputText: null,
    outputJson: null,
    metadataJson: null,
    provider: null,
    model: null,
    status: "PENDING_CHAIN",
    sequence: null,
    account: null,
    solanaTransaction: null,
    recordHash: null,
    prevRecordHash: null,
    chainTimestamp: null,
    agentId: null,
    toolName: null,
    actionType: null,
    externalApi: null,
    parentProofId: null,
    tamperedBackupJson: null,
    createdAt,
  };
}

function agentColumns(agent: AgentFields) {
  return {
    agentId: agent.agentId ?? null,
    toolName: agent.toolName ?? null,
    actionType: agent.actionType ?? null,
    externalApi: agent.externalApi ?? null,
    parentProofId: agent.parentProofId ?? null,
  };
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function createProofService(deps: ProofServiceDeps) {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? randomUUID;
  const makeSalt = deps.newSalt ?? newSalt;

  async function load(id: string): Promise<ProofRow> {
    const row = await deps.repo.get(id);
    if (!row) throw new NotFoundError(`Proof ${id} not found`);
    return row;
  }

  async function markAnchored(id: string, r: { signature: string | null; account: string; sequence: number; recordHash: string; prevRecordHash: string; timestamp: number }) {
    await deps.repo.update(id, {
      status: "ANCHORED",
      solanaTransaction: r.signature,
      account: r.account,
      sequence: r.sequence,
      recordHash: r.recordHash,
      prevRecordHash: r.prevRecordHash,
      chainTimestamp: r.timestamp,
    });
  }

  async function anchor(row: ProofRow): Promise<ProofOutcome> {
    try {
      const r = await deps.chain.anchorProof({
        proofId: row.id,
        inputHash: row.inputHash,
        outputHash: row.outputHash,
        metadataHash: row.metadataHash,
      });
      await markAnchored(row.id, r);
      return { proof: await load(row.id), chainError: null };
    } catch (e) {
      return { proof: await load(row.id), chainError: message(e) };
    }
  }

  /** A confirmed transaction can lose its response; look for our proof near the chain tip before writing again. */
  async function findOnChain(proofId: string) {
    const issuer = await deps.chain.readIssuer();
    if (!issuer) return null;
    for (let seq = issuer.proofCount - 1; seq >= Math.max(0, issuer.proofCount - RETRY_LOOKBACK); seq--) {
      const record = await deps.chain.readProofBySequence(seq);
      if (record?.proofId === proofId) return record;
    }
    return null;
  }

  function requireFull(row: ProofRow): asserts row is ProofRow & { outputJson: string } {
    if (row.mode !== "full" || row.outputJson === null) throw new ValidationError("This action needs a proof with stored content");
  }

  return {
    async createProof(input: { fileName: string; bytes: Buffer; agent?: AgentFields }): Promise<ProofOutcome> {
      const agent = input.agent ?? {};
      const text = await extractText(input.fileName, input.bytes);
      const analysis: AnalysisResult = await deps.ai.analyze(text);
      const createdAt = now();
      const salt = makeSalt();
      const metadata: Record<string, string> = {
        provider: deps.ai.name,
        model: deps.ai.model,
        model_attestation: "declared",
        created_at: createdAt.toISOString(),
        file_name: input.fileName,
      };
      if (agent.agentId) metadata.agent_id = agent.agentId;
      if (agent.toolName) metadata.tool_name = agent.toolName;
      if (agent.actionType) metadata.action_type = agent.actionType;
      if (agent.externalApi) metadata.external_api = agent.externalApi;
      if (agent.parentProofId) metadata.parent_proof_id = agent.parentProofId;
      const outputJson = canonicalJson(analysis);
      const metadataJson = canonicalJson(metadata);
      const row: ProofRow = {
        ...emptyRow(newId(), createdAt),
        ...agentColumns(agent),
        mode: "full",
        salt,
        inputBlob: input.bytes,
        inputFileName: input.fileName,
        inputText: text,
        outputJson,
        metadataJson,
        inputHash: saltedHash(salt, input.bytes),
        outputHash: saltedHash(salt, outputJson),
        metadataHash: saltedHash(salt, metadataJson),
        provider: deps.ai.name,
        model: deps.ai.model,
      };
      await deps.repo.create(row);
      return anchor(row);
    },

    async createHashOnlyProof(input: { inputHash: string; outputHash: string; metadataHash: string; agent?: AgentFields }): Promise<ProofOutcome> {
      const hashes = { inputHash: input.inputHash, outputHash: input.outputHash, metadataHash: input.metadataHash };
      for (const [name, value] of Object.entries(hashes)) {
        if (typeof value !== "string" || !HEX64.test(value.toLowerCase())) {
          throw new ValidationError(`${name} must be 64 hex characters`);
        }
      }
      const row: ProofRow = {
        ...emptyRow(newId(), now()),
        ...agentColumns(input.agent ?? {}),
        mode: "hashes",
        inputHash: input.inputHash.toLowerCase(),
        outputHash: input.outputHash.toLowerCase(),
        metadataHash: input.metadataHash.toLowerCase(),
      };
      await deps.repo.create(row);
      return anchor(row);
    },

    async retryAnchoring(id: string): Promise<ProofOutcome> {
      const row = await load(id);
      if (row.status === "ANCHORED") return { proof: row, chainError: null };
      const existing = await findOnChain(row.id);
      if (existing) {
        await markAnchored(row.id, { ...existing, signature: null });
        return { proof: await load(row.id), chainError: null };
      }
      return anchor(row);
    },

    async tamperOutput(id: string): Promise<ProofRow> {
      const row = await load(id);
      requireFull(row);
      if (row.tamperedBackupJson) return row;
      const original = JSON.parse(row.outputJson) as AnalysisResult;
      const forged = canonicalJson({ ...original, riskScore: 5, issues: [], summary: "No notable risk factors found." });
      await deps.repo.update(id, { outputJson: forged, tamperedBackupJson: row.outputJson });
      return load(id);
    },

    async restoreOutput(id: string): Promise<ProofRow> {
      const row = await load(id);
      if (!row.tamperedBackupJson) return row;
      await deps.repo.update(id, { outputJson: row.tamperedBackupJson, tamperedBackupJson: null });
      return load(id);
    },

    async deleteProof(id: string): Promise<{ sequence: number | null }> {
      const row = await load(id);
      await deps.repo.delete(id);
      return { sequence: row.sequence };
    },
  };
}

export type ProofService = ReturnType<typeof createProofService>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/proof-service.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/proof-hashes.ts lib/proof-service.ts tests/proof-service.test.ts
git commit -m "feat: add proof service with hash-only mode, retry and demo actions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Verifier and verdict texts

**Files:**
- Create: `lib/verifier.ts`, `lib/verification-text.ts`, `lib/format.ts`
- Test: `tests/verifier.test.ts`, `tests/verification-text.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/verifier.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { NotFoundError } from "@/lib/errors";
import { canonicalJson } from "@/lib/hashing";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";
import { verifyProof } from "@/lib/verifier";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

async function setup(count = 1) {
  let n = 0;
  let t = 1790000000;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient({ clock: () => t++ });
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  for (let i = 0; i < count; i++) await service.createProof({ fileName: `c${i}.txt`, bytes: CONTRACT });
  return { repo, chain, service, deps: { repo, chain } };
}
const ID0 = "123e4567-e89b-42d3-a456-426614174000";
const ID1 = "123e4567-e89b-42d3-a456-426614174001";

describe("verifyProof", () => {
  it("verifies an untouched proof", async () => {
    const { deps } = await setup();
    const r = await verifyProof(deps, ID0);
    expect(r.status).toBe("VERIFIED");
    expect(Object.values(r.checks).every((c) => c.ok)).toBe(true);
    expect(r.checks.chain.sequence).toBe(0);
    expect(r.onChainTimestamp).toBe(1790000001); // tick 0 registers the issuer
  });

  it("fails on output when the AI response is modified", async () => {
    const { deps, service } = await setup();
    await service.tamperOutput(ID0);
    const r = await verifyProof(deps, ID0);
    expect(r.status).toBe("FAILED");
    expect(r.checks.output.ok).toBe(false);
    expect(r.checks.output.stored).not.toBe(r.checks.output.current);
    expect(r.checks.input.ok && r.checks.metadata.ok).toBe(true);
  });

  it("fails on input when the document is modified", async () => {
    const { deps, repo } = await setup();
    await repo.update(ID0, { inputBlob: Buffer.from("A different contract") });
    expect((await verifyProof(deps, ID0)).checks.input.ok).toBe(false);
  });

  it("fails on metadata when the declared model is changed", async () => {
    const { deps, repo } = await setup();
    const row = (await repo.get(ID0))!;
    await repo.update(ID0, { metadataJson: canonicalJson({ ...JSON.parse(row.metadataJson!), model: "gpt-9" }) });
    expect((await verifyProof(deps, ID0)).checks.metadata.ok).toBe(false);
  });

  it("ignores hash columns edited in the database", async () => {
    const { deps, repo } = await setup();
    await repo.update(ID0, { outputJson: '{"riskScore":5}', outputHash: "00".repeat(32) });
    expect((await verifyProof(deps, ID0)).checks.output.ok).toBe(false);
  });

  it("fails the chain check when the previous record was altered", async () => {
    const { deps, chain } = await setup(2);
    chain.overwriteRecord(0, { recordHash: "11".repeat(32) });
    const r = await verifyProof(deps, ID1);
    expect(r.status).toBe("FAILED");
    expect(r.checks.chain.ok).toBe(false);
    expect(r.checks.record.ok).toBe(true);
  });

  it("fails the record check when on-chain fields do not match the record hash", async () => {
    const { deps, chain } = await setup();
    chain.overwriteRecord(0, { timestamp: 1 });
    expect((await verifyProof(deps, ID0)).checks.record.ok).toBe(false);
  });

  it("reports NOT_ON_CHAIN when anchoring never happened", async () => {
    const { deps, chain, service } = await setup(0);
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    expect((await verifyProof(deps, ID0)).status).toBe("NOT_ON_CHAIN");
  });

  it("verifies hash-only proofs against their stored hashes", async () => {
    const { deps, service } = await setup(0);
    await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    expect((await verifyProof(deps, ID0)).status).toBe("VERIFIED");
  });

  it("throws NotFoundError for unknown proofs", async () => {
    const { deps } = await setup(0);
    await expect(verifyProof(deps, "missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

`tests/verification-text.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { VerificationResult } from "@/lib/verifier";
import { failedParts, verdictText } from "@/lib/verification-text";

function result(overrides: Partial<Record<keyof VerificationResult["checks"], boolean>> = {}, status: VerificationResult["status"] = "FAILED"): VerificationResult {
  const hash = (ok: boolean) => ({ ok, stored: "a", current: ok ? "a" : "b" });
  return {
    status,
    checks: {
      input: hash(overrides.input ?? true),
      output: hash(overrides.output ?? true),
      metadata: hash(overrides.metadata ?? true),
      record: { ok: overrides.record ?? true },
      chain: { ok: overrides.chain ?? true, sequence: 3 },
      issuer: { ok: overrides.issuer ?? true, expected: "x", onChain: "x" },
    },
    onChainTimestamp: 1790000000,
    explorerUrl: null,
  };
}

describe("failedParts", () => {
  it("lists changed data parts in reading order", () => {
    expect(failedParts(result({ output: false, input: false }))).toEqual(["document", "AI output"]);
  });
});

describe("verdictText", () => {
  it("explains a verified proof with its recording time", () => {
    const v = verdictText(result({}, "VERIFIED"));
    expect(v.title).toBe("Verified");
    expect(v.body).toBe("This AI result hasn't changed since it was recorded on 21 Sept 2026, 14:13 UTC.");
  });
  it("names a single changed part", () => {
    expect(verdictText(result({ output: false })).body).toBe("The AI output was changed after it was recorded.");
  });
  it("names several changed parts", () => {
    expect(verdictText(result({ input: false, output: false })).body).toBe("The document and the AI output were changed after they were recorded.");
  });
  it("explains a broken history link", () => {
    expect(verdictText(result({ chain: false })).body).toBe("This record doesn't link correctly to the previous one in the history.");
  });
  it("explains an inconsistent record", () => {
    expect(verdictText(result({ record: false })).body).toBe("The record on Solana is internally inconsistent.");
  });
  it("explains an unexpected issuer", () => {
    expect(verdictText(result({ issuer: false })).body).toBe("This record was written by an unexpected issuer.");
  });
  it("explains a proof that is not on chain yet", () => {
    expect(verdictText(result({}, "NOT_ON_CHAIN")).title).toBe("Not on Solana yet");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/verifier.test.ts tests/verification-text.test.ts`
Expected: FAIL — cannot resolve `@/lib/verifier` and `@/lib/verification-text`.

- [ ] **Step 3: Implement**

`lib/format.ts`:
```ts
const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatUtc(unixSeconds: number): string {
  return `${DATE_FMT.format(new Date(unixSeconds * 1000))} UTC`;
}

export function formatIso(iso: string): string {
  return formatUtc(Math.floor(new Date(iso).getTime() / 1000));
}

export function shortHash(value: string, head = 6, tail = 4): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
```

> Note: `Intl` month names for `en-GB` can render as "Sep" or "Sept" depending on the Node ICU version. If the verdict-text test fails only on that word, update the expected string in `tests/verification-text.test.ts` to what `formatUtc(1790000000)` prints on this machine (`node -e "console.log(new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(1790000000000)))"`).

`lib/verifier.ts`:
```ts
import { NotFoundError } from "./errors";
import { currentHashes } from "./proof-hashes";
import type { ProofRepo } from "./proof-repo";
import { ZERO_HASH, computeRecordHash } from "./solana/record-hash";
import type { ChainClient } from "./solana/types";

export interface HashCheck {
  ok: boolean;
  stored: string; // on-chain value
  current: string; // recomputed now
}

export interface VerificationResult {
  status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN";
  checks: {
    input: HashCheck;
    output: HashCheck;
    metadata: HashCheck;
    record: { ok: boolean };
    chain: { ok: boolean; sequence: number };
    issuer: { ok: boolean; expected: string; onChain: string };
  };
  onChainTimestamp: number | null;
  explorerUrl: string | null;
}

export async function verifyProof(deps: { repo: ProofRepo; chain: ChainClient }, id: string): Promise<VerificationResult> {
  const row = await deps.repo.get(id);
  if (!row) throw new NotFoundError(`Proof ${id} not found`);
  const current = currentHashes(row);
  const expectedIssuer = deps.chain.issuerAddress();
  const explorerUrl = row.solanaTransaction ? deps.chain.explorerUrl(row.solanaTransaction) : null;
  const record = row.account ? await deps.chain.readProofAccount(row.account) : null;

  if (!record) {
    const missing = (value: string): HashCheck => ({ ok: false, stored: "", current: value });
    return {
      status: "NOT_ON_CHAIN",
      checks: {
        input: missing(current.input),
        output: missing(current.output),
        metadata: missing(current.metadata),
        record: { ok: false },
        chain: { ok: false, sequence: row.sequence ?? -1 },
        issuer: { ok: false, expected: expectedIssuer, onChain: "" },
      },
      onChainTimestamp: null,
      explorerUrl,
    };
  }

  const check = (stored: string, now: string): HashCheck => ({ ok: stored === now, stored, current: now });
  let chainOk: boolean;
  if (record.sequence === 0) {
    chainOk = record.prevRecordHash === ZERO_HASH;
  } else {
    const prev = await deps.chain.readProofBySequence(record.sequence - 1);
    chainOk = prev !== null && prev.recordHash === record.prevRecordHash;
  }

  const checks: VerificationResult["checks"] = {
    input: check(record.inputHash, current.input),
    output: check(record.outputHash, current.output),
    metadata: check(record.metadataHash, current.metadata),
    record: { ok: computeRecordHash(record) === record.recordHash },
    chain: { ok: chainOk, sequence: record.sequence },
    issuer: { ok: record.issuer === expectedIssuer, expected: expectedIssuer, onChain: record.issuer },
  };
  const allOk = Object.values(checks).every((c) => c.ok);
  return { status: allOk ? "VERIFIED" : "FAILED", checks, onChainTimestamp: record.timestamp, explorerUrl };
}
```

`lib/verification-text.ts`:
```ts
import { formatUtc } from "./format";
import type { VerificationResult } from "./verifier";

const PARTS = [
  ["input", "document"],
  ["output", "AI output"],
  ["metadata", "metadata"],
] as const;

export function failedParts(r: VerificationResult): string[] {
  return PARTS.filter(([key]) => !r.checks[key].ok).map(([, label]) => label);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function verdictText(r: VerificationResult): { title: string; body: string } {
  if (r.status === "VERIFIED") {
    const when = r.onChainTimestamp !== null ? ` on ${formatUtc(r.onChainTimestamp)}` : "";
    return { title: "Verified", body: `This AI result hasn't changed since it was recorded${when}.` };
  }
  if (r.status === "NOT_ON_CHAIN") {
    return { title: "Not on Solana yet", body: "We saved this proof but couldn't record it on Solana. Retry to finish." };
  }
  const parts = failedParts(r);
  if (parts.length === 1) {
    return { title: "Verification failed", body: `${capitalize(`the ${parts[0]}`)} was changed after it was recorded.` };
  }
  if (parts.length > 1) {
    const list = parts.map((p) => `the ${p}`);
    const joined = `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
    return { title: "Verification failed", body: `${capitalize(joined)} were changed after they were recorded.` };
  }
  if (!r.checks.chain.ok) {
    return { title: "Verification failed", body: "This record doesn't link correctly to the previous one in the history." };
  }
  if (!r.checks.record.ok) {
    return { title: "Verification failed", body: "The record on Solana is internally inconsistent." };
  }
  return { title: "Verification failed", body: "This record was written by an unexpected issuer." };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/verifier.test.ts tests/verification-text.test.ts`
Expected: PASS (17 tests). If only the "Sept"/"Sep" string differs, apply the note under `lib/format.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/verifier.ts lib/verification-text.ts lib/format.ts tests/verifier.test.ts tests/verification-text.test.ts
git commit -m "feat: add verifier with record/chain/issuer checks and plain-language verdicts" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: History audit

**Files:**
- Create: `lib/history-audit.ts`
- Test: `tests/history-audit.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/history-audit.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { auditHistory } from "@/lib/history-audit";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");

async function setup(count: number) {
  let n = 0;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  for (let i = 0; i < count; i++) await service.createProof({ fileName: `c${i}.txt`, bytes: CONTRACT });
  return { repo, chain, service, deps: { repo, chain } };
}
const id = (i: number) => `123e4567-e89b-42d3-a456-42661417400${i}`;

describe("auditHistory", () => {
  it("returns an empty history before the first proof", async () => {
    const { deps } = await setup(0);
    expect(await auditHistory(deps)).toMatchObject({ total: 0, ok: 0, problems: 0, entries: [] });
  });

  it("reports every record intact", async () => {
    const { deps } = await setup(3);
    const audit = await auditHistory(deps);
    expect(audit).toMatchObject({ total: 3, ok: 3, problems: 0 });
    expect(audit.entries.map((e) => e.sequence)).toEqual([0, 1, 2]);
    expect(audit.entries[1]).toMatchObject({ status: "OK", dbId: id(1), fileName: "c1.txt" });
  });

  it("detects a record deleted from the database", async () => {
    const { deps, service } = await setup(3);
    await service.deleteProof(id(1));
    const audit = await auditHistory(deps);
    expect(audit.problems).toBe(1);
    expect(audit.entries[1]).toMatchObject({ status: "MISSING_IN_DATABASE", dbId: null });
  });

  it("detects modified data", async () => {
    const { deps, service } = await setup(2);
    await service.tamperOutput(id(0));
    expect((await auditHistory(deps)).entries[0].status).toBe("DATA_MODIFIED");
  });

  it("detects a broken chain", async () => {
    const { deps, chain } = await setup(2);
    chain.overwriteRecord(1, { prevRecordHash: "11".repeat(32) });
    expect((await auditHistory(deps)).entries[1].status).toBe("CHAIN_BROKEN");
  });

  it("marks hash-only proofs without counting them as problems", async () => {
    const { deps, service } = await setup(0);
    await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    const audit = await auditHistory(deps);
    expect(audit.entries[0].status).toBe("HASH_ONLY");
    expect(audit).toMatchObject({ ok: 1, problems: 0 });
  });

  it("counts proofs still waiting for the chain", async () => {
    const { deps, chain, service } = await setup(1);
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "late.txt", bytes: CONTRACT });
    expect((await auditHistory(deps)).pendingInDatabase).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/history-audit.test.ts`
Expected: FAIL — cannot resolve `@/lib/history-audit`.

- [ ] **Step 3: Implement**

`lib/history-audit.ts`:
```ts
import { currentHashes } from "./proof-hashes";
import type { ProofRepo, ProofRow } from "./proof-repo";
import { ZERO_HASH, computeRecordHash } from "./solana/record-hash";
import type { ChainClient } from "./solana/types";

export type AuditStatus = "OK" | "HASH_ONLY" | "MISSING_IN_DATABASE" | "DATA_MODIFIED" | "CHAIN_BROKEN";

export interface AuditEntry {
  sequence: number;
  status: AuditStatus;
  proofId: string | null;
  dbId: string | null;
  fileName: string | null;
  timestamp: number | null;
  account: string | null;
}

export interface HistoryAudit {
  issuer: string;
  issuerName: string | null;
  total: number;
  ok: number;
  problems: number;
  pendingInDatabase: number;
  entries: AuditEntry[];
}

function contentMatches(row: ProofRow, record: { inputHash: string; outputHash: string; metadataHash: string }): boolean {
  const now = currentHashes(row);
  return now.input === record.inputHash && now.output === record.outputHash && now.metadata === record.metadataHash;
}

/** Walks the issuer's on-chain history in order and compares every record with the database. */
export async function auditHistory(deps: { repo: ProofRepo; chain: ChainClient }): Promise<HistoryAudit> {
  const issuer = await deps.chain.readIssuer();
  const rows = await deps.repo.list();
  const bySequence = new Map<number, ProofRow>();
  for (const row of rows) if (row.status === "ANCHORED" && row.sequence !== null) bySequence.set(row.sequence, row);
  const pendingInDatabase = rows.filter((r) => r.status === "PENDING_CHAIN").length;

  const entries: AuditEntry[] = [];
  let prevHash = ZERO_HASH;
  for (let seq = 0; seq < (issuer?.proofCount ?? 0); seq++) {
    const record = await deps.chain.readProofBySequence(seq);
    const row = bySequence.get(seq) ?? null;
    const base = { sequence: seq, dbId: row?.id ?? null, fileName: row?.inputFileName ?? null };
    if (!record) {
      entries.push({ ...base, status: "CHAIN_BROKEN", proofId: null, timestamp: null, account: null });
      continue;
    }
    const linked = record.prevRecordHash === prevHash && computeRecordHash(record) === record.recordHash;
    prevHash = record.recordHash;
    let status: AuditStatus;
    if (!linked) status = "CHAIN_BROKEN";
    else if (!row) status = "MISSING_IN_DATABASE";
    else if (row.mode === "hashes") status = "HASH_ONLY";
    else status = contentMatches(row, record) ? "OK" : "DATA_MODIFIED";
    entries.push({ ...base, status, proofId: record.proofId, timestamp: record.timestamp, account: record.account });
  }

  const ok = entries.filter((e) => e.status === "OK" || e.status === "HASH_ONLY").length;
  return {
    issuer: deps.chain.issuerAddress(),
    issuerName: issuer?.name ?? null,
    total: entries.length,
    ok,
    problems: entries.length - ok,
    pendingInDatabase,
    entries,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/history-audit.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/history-audit.ts tests/history-audit.test.ts
git commit -m "feat: add history audit that detects deleted, modified and unlinked records" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Evidence pack, view model, wiring and API

**Files:**
- Create: `lib/evidence-pack.ts`, `lib/public-proof.ts`, `lib/api.ts`, `lib/config.ts`, `lib/solana/index.ts`, `lib/services.ts`
- Create: all `app/api/**/route.ts` files listed in the file map
- Test: `tests/evidence-pack.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/evidence-pack.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";
import { ValidationError } from "@/lib/errors";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { createProofService } from "@/lib/proof-service";
import { MemoryProofRepo } from "@/lib/proof-repo-memory";
import { InMemoryChainClient } from "@/lib/solana/memory-client";

const CONTRACT = Buffer.from("Termination with notice. Liability limited. Payment in 60 days.");
const ID0 = "123e4567-e89b-42d3-a456-426614174000";

async function setup() {
  let n = 0;
  const repo = new MemoryProofRepo();
  const chain = new InMemoryChainClient();
  const service = createProofService({ repo, chain, ai: new MockAIProvider(), newId: () => `123e4567-e89b-42d3-a456-42661417400${n++}` });
  return { repo, chain, service, deps: { repo, chain } };
}

describe("buildEvidencePack", () => {
  it("contains everything needed to verify without our server", async () => {
    const { deps, service, chain } = await setup();
    const { proof } = await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    const pack = await buildEvidencePack(deps, ID0);
    expect(pack).toMatchObject({
      version: "proofapi-evidence-v1",
      cluster: "memory",
      issuer: chain.issuerAddress(),
      proof_account: "memory:0",
      sequence: 0,
      proof_id: ID0,
      salt: proof.salt,
      output_json: proof.outputJson,
      metadata_json: proof.metadataJson,
    });
    expect(Buffer.from(pack.input.content_base64, "base64").equals(CONTRACT)).toBe(true);
    expect(pack.input.file_name).toBe("c.txt");
  });

  it("refuses proofs that are not on chain or have no stored content", async () => {
    const { deps, service, chain } = await setup();
    chain.failNextAnchor = new Error("RPC down");
    await service.createProof({ fileName: "c.txt", bytes: CONTRACT });
    await expect(buildEvidencePack(deps, ID0)).rejects.toBeInstanceOf(ValidationError);
    const hashOnly = await service.createHashOnlyProof({ inputHash: "aa".repeat(32), outputHash: "bb".repeat(32), metadataHash: "cc".repeat(32) });
    await expect(buildEvidencePack(deps, hashOnly.proof.id)).rejects.toBeInstanceOf(ValidationError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/evidence-pack.test.ts`
Expected: FAIL — cannot resolve `@/lib/evidence-pack`.

- [ ] **Step 3: Implement library wiring**

`lib/evidence-pack.ts`:
```ts
import { NotFoundError, ValidationError } from "./errors";
import type { ProofRepo } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface EvidencePack {
  version: "proofapi-evidence-v1";
  cluster: string;
  rpc_url: string | null;
  program_id: string | null;
  issuer: string;
  proof_account: string;
  sequence: number;
  proof_id: string;
  salt: string;
  input: { file_name: string; content_base64: string };
  output_json: string;
  metadata_json: string;
}

export async function buildEvidencePack(deps: { repo: ProofRepo; chain: ChainClient }, id: string): Promise<EvidencePack> {
  const row = await deps.repo.get(id);
  if (!row) throw new NotFoundError(`Proof ${id} not found`);
  if (row.mode !== "full" || !row.salt || !row.inputBlob || row.outputJson === null || row.metadataJson === null) {
    throw new ValidationError("Evidence packs are available only for proofs with stored content");
  }
  if (row.status !== "ANCHORED" || row.account === null || row.sequence === null) {
    throw new ValidationError("This proof is not on Solana yet");
  }
  const ctx = deps.chain.evidenceContext();
  return {
    version: "proofapi-evidence-v1",
    cluster: ctx.cluster,
    rpc_url: ctx.rpcUrl,
    program_id: ctx.programId,
    issuer: deps.chain.issuerAddress(),
    proof_account: row.account,
    sequence: row.sequence,
    proof_id: row.id,
    salt: row.salt,
    input: { file_name: row.inputFileName ?? "input", content_base64: row.inputBlob.toString("base64") },
    output_json: row.outputJson,
    metadata_json: row.metadataJson,
  };
}
```

`lib/public-proof.ts`:
```ts
import type { AnalysisResult } from "./ai-provider";
import type { ProofMode, ProofRow, ProofStatus } from "./proof-repo";
import type { ChainClient } from "./solana/types";

export interface PublicProof {
  id: string;
  mode: ProofMode;
  status: ProofStatus;
  sequence: number | null;
  account: string | null;
  inputFileName: string | null;
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  recordHash: string | null;
  provider: string | null;
  model: string | null;
  output: AnalysisResult | null;
  metadata: Record<string, unknown> | null;
  isTampered: boolean;
  createdAt: string;
  chainTimestamp: number | null;
  explorerUrl: string | null;
  accountUrl: string | null;
  agentId: string | null;
}

export function toPublicProof(row: ProofRow, chain: ChainClient): PublicProof {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    sequence: row.sequence,
    account: row.account,
    inputFileName: row.inputFileName,
    inputHash: row.inputHash,
    outputHash: row.outputHash,
    metadataHash: row.metadataHash,
    recordHash: row.recordHash,
    provider: row.provider,
    model: row.model,
    output: row.outputJson ? (JSON.parse(row.outputJson) as AnalysisResult) : null,
    metadata: row.metadataJson ? (JSON.parse(row.metadataJson) as Record<string, unknown>) : null,
    isTampered: row.tamperedBackupJson !== null,
    createdAt: row.createdAt.toISOString(),
    chainTimestamp: row.chainTimestamp,
    explorerUrl: row.solanaTransaction ? chain.explorerUrl(row.solanaTransaction) : null,
    accountUrl: row.account ? chain.accountUrl(row.account) : null,
    agentId: row.agentId,
  };
}
```

`lib/api.ts`:
```ts
import { NextResponse } from "next/server";
import { NotFoundError, ValidationError } from "./errors";

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
  console.error(e);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

export type IdContext = { params: Promise<{ id: string }> };
```

`lib/config.ts`:
```ts
export type ChainMode = "memory" | "anchor";

export function getChainMode(): ChainMode {
  return process.env.CHAIN_MODE === "anchor" ? "anchor" : "memory";
}
```

`lib/solana/index.ts`:
```ts
import { InMemoryChainClient } from "./memory-client";
import type { ChainClient } from "./types";

const g = globalThis as { __proofapiChain?: ChainClient };

/** One chain client per server process; survives dev hot reloads. */
export function getChainClient(): ChainClient {
  if (g.__proofapiChain) return g.__proofapiChain;
  const mode = process.env.CHAIN_MODE ?? "memory";
  if (mode !== "memory") throw new Error(`CHAIN_MODE=${mode} is not available yet (added in Plan B)`);
  g.__proofapiChain = new InMemoryChainClient({ name: process.env.ISSUER_NAME ?? "ProofAPI Demo" });
  return g.__proofapiChain;
}
```

`lib/services.ts`:
```ts
import { MockAIProvider } from "./ai-provider";
import { prisma } from "./db";
import { createProofService } from "./proof-service";
import { PrismaProofRepo } from "./proof-repo-prisma";
import { getChainClient } from "./solana";

export function getServices() {
  const repo = new PrismaProofRepo(prisma);
  const chain = getChainClient();
  const proofs = createProofService({ repo, chain, ai: new MockAIProvider() });
  return { repo, chain, proofs, deps: { repo, chain } };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/evidence-pack.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the route handlers**

`app/api/proofs/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationError("Choose a file to upload");
    const field = (key: string) => {
      const v = form.get(key);
      return typeof v === "string" && v.trim() ? v.trim() : undefined;
    };
    const { proofs, chain } = getServices();
    const { proof, chainError } = await proofs.createProof({
      fileName: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
      agent: {
        agentId: field("agent_id"),
        toolName: field("tool_name"),
        actionType: field("action_type"),
        externalApi: field("external_api"),
        parentProofId: field("parent_proof_id"),
      },
    });
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    const { repo, chain } = getServices();
    const rows = await repo.list();
    return NextResponse.json({ proofs: rows.map((r) => toPublicProof(r, chain)) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/hashes/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) throw new ValidationError("Send a JSON body with input_hash, output_hash and metadata_hash");
    const str = (key: string) => (typeof body[key] === "string" ? (body[key] as string) : "");
    const { proofs, chain } = getServices();
    const { proof, chainError } = await proofs.createHashOnlyProof({
      inputHash: str("input_hash"),
      outputHash: str("output_hash"),
      metadataHash: str("metadata_hash"),
      agent: { agentId: str("agent_id") || undefined, toolName: str("tool_name") || undefined },
    });
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { repo, chain } = getServices();
    const row = await repo.get(id);
    if (!row) throw new NotFoundError("This proof doesn't exist or was deleted");
    return NextResponse.json({ proof: toPublicProof(row, chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/verify/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { getServices } from "@/lib/services";
import { verifyProof } from "@/lib/verifier";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    return NextResponse.json({ result: await verifyProof(getServices().deps, id) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/evidence/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { buildEvidencePack } from "@/lib/evidence-pack";
import { getServices } from "@/lib/services";

export async function GET(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const pack = await buildEvidencePack(getServices().deps, id);
    return new NextResponse(JSON.stringify(pack, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="proofapi-evidence-${pack.sequence}.json"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/retry/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { proofs, chain } = getServices();
    const { proof, chainError } = await proofs.retryAnchoring(id);
    return NextResponse.json({ proof: toPublicProof(proof, chain), chainError });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/tamper/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { proofs, chain } = getServices();
    return NextResponse.json({ proof: toPublicProof(await proofs.tamperOutput(id), chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/restore/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    const { proofs, chain } = getServices();
    return NextResponse.json({ proof: toPublicProof(await proofs.restoreOutput(id), chain) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/proofs/[id]/delete/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse, type IdContext } from "@/lib/api";
import { getServices } from "@/lib/services";

export async function POST(_req: Request, { params }: IdContext) {
  try {
    const { id } = await params;
    return NextResponse.json(await getServices().proofs.deleteProof(id));
  } catch (e) {
    return errorResponse(e);
  }
}
```

`app/api/history/audit/route.ts`:
```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { auditHistory } from "@/lib/history-audit";
import { getServices } from "@/lib/services";

export async function GET() {
  try {
    return NextResponse.json({ audit: await auditHistory(getServices().deps) });
  } catch (e) {
    return errorResponse(e);
  }
}
```

- [ ] **Step 6: Run the full test suite and typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests PASS; no type errors.

- [ ] **Step 7: API smoke test against the dev server**

Run: `npm run db:reset` then start `npm run dev` in the background, then:
```bash
curl -s -F file=@public/sample-contract.txt http://localhost:3000/api/proofs
```
Expected: JSON with `"status":"ANCHORED"`, `"sequence":0`, `"riskScore":31`, `"chainError":null`. Copy the `id`, then:
```bash
curl -s http://localhost:3000/api/proofs/<id>/verify
curl -s -X POST http://localhost:3000/api/proofs/<id>/tamper > /dev/null
curl -s http://localhost:3000/api/proofs/<id>/verify
curl -s http://localhost:3000/api/history/audit
```
Expected: first verify `"status":"VERIFIED"`, second `"status":"FAILED"` with `"output":{"ok":false`, audit entry `"status":"DATA_MODIFIED"`. Stop the dev server afterwards.

- [ ] **Step 8: Commit**

```bash
git add lib app/api tests/evidence-pack.test.ts
git commit -m "feat: add evidence pack, view model, service wiring and API routes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: UI foundation (primitives, navigation, layout)

**Files:**
- Create: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/copy-button.tsx`, `components/nav-bar.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the primitives**

`components/ui/button.tsx`:
```tsx
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
  ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", href, children }: { variant?: Variant; className?: string; href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
```

`components/ui/card.tsx`:
```tsx
import type { ReactNode } from "react";

export function Card({ title, action, className = "", children }: { title?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
```

`components/ui/badge.tsx`:
```tsx
import type { ReactNode } from "react";

export type Tone = "neutral" | "success" | "danger" | "warning" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}
```

`components/ui/copy-button.tsx`:
```tsx
"use client";

import { useState } from "react";
import { buttonClass } from "./button";

export function CopyButton({ value, label = "Copy", variant = "ghost" }: { value: string; label?: string; variant?: "ghost" | "secondary" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context); the value stays visible on the page.
    }
  }
  return (
    <button type="button" onClick={copy} className={buttonClass(variant, "px-3 py-1.5")} aria-live="polite">
      {copied ? "Copied ✓" : label}
    </button>
  );
}
```

`components/nav-bar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ChainMode } from "@/lib/config";
import { Badge } from "./ui/badge";

const LINKS = [
  { href: "/new", label: "Create proof" },
  { href: "/history", label: "History" },
];

export function NavBar({ chainMode }: { chainMode: ChainMode }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-xs font-bold text-white">
            P
          </span>
          ProofAPI
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = path.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-sm ${active ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <span className="ml-2 hidden sm:inline">
            <Badge tone={chainMode === "anchor" ? "info" : "warning"}>{chainMode === "anchor" ? "Solana devnet" : "Local simulation"}</Badge>
          </span>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Use them in the layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { NavBar } from "@/components/nav-bar";
import { getChainMode } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofAPI — Git history for AI",
  description: "Tamper-evident, independently verifiable records of what your AI received and returned.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <NavBar chainMode={getChainMode()} />
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-zinc-500">
          ProofAPI MVP · Proofs are tamper-evident after recording.{" "}
          <Link href="/#limits" className="underline hover:text-zinc-900">
            What we don&apos;t prove
          </Link>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build compiles.

- [ ] **Step 4: Commit**

```bash
git add components app/layout.tsx
git commit -m "feat(ui): add design primitives, navigation and layout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the page**

`app/page.tsx`:
```tsx
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  { title: "Upload", body: "A document, a prompt or any input your AI works on." },
  { title: "AI answers", body: "We capture the answer together with the model and time." },
  { title: "Fingerprints on Solana", body: "Salted hashes join your issuer's tamper-evident history." },
];

const GUARANTEES = [
  "The input, the AI output and the metadata haven't changed since recording",
  "A record can't be backdated — the time comes from the blockchain",
  "Records can't be silently deleted or reordered in your history",
  "Every record is signed by a registered issuer key",
];

const LIMITS = [
  "That the issuer recorded the truth at the moment of recording",
  "Which model really ran — the model name is declared by the issuer",
  "That every AI action was recorded — only that recorded ones weren't altered",
  "Legal admissibility in a specific court",
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="max-w-2xl">
        <p className="text-sm font-medium text-zinc-500">Tamper-evident audit trail for AI</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Git history for AI.</h1>
        <p className="mt-4 text-lg text-zinc-600">
          Record what your AI received and returned. Anyone can verify it hasn&apos;t changed — without trusting you or us.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/new">Create your first proof</ButtonLink>
          <ButtonLink href="/history" variant="secondary">
            See the history
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="how" className="space-y-4">
        <h2 id="how" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">{i + 1}</span>
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section id="limits" aria-labelledby="guarantees" className="grid gap-4 sm:grid-cols-2">
        <Card title="What we guarantee">
          <ul className="space-y-2 text-sm text-zinc-700">
            {GUARANTEES.map((g) => (
              <li key={g} className="flex gap-2">
                <span aria-hidden className="text-emerald-600">
                  ✓
                </span>
                {g}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="What we don't prove">
          <ul className="space-y-2 text-sm text-zinc-700">
            {LIMITS.map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden className="text-zinc-400">
                  –
                </span>
                {l}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">Provider-signed AI responses (zkTLS) are on the roadmap to close the first two gaps.</p>
        </Card>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): add landing page with guarantees and honest limits" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Create-proof flow (`/new`)

**Files:**
- Create: `components/dropzone.tsx`, `components/step-timeline.tsx`, `components/risk-score.tsx`, `app/new/page.tsx`

- [ ] **Step 1: Write the components**

`components/dropzone.tsx`:
```tsx
"use client";

import { useState, type DragEvent } from "react";

export function Dropzone({ onFile, disabled = false }: { onFile: (file: File) => void; disabled?: boolean }) {
  const [over, setOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-zinc-900 ${
        over ? "border-zinc-900 bg-zinc-100" : "border-zinc-300 bg-white hover:border-zinc-400"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <span className="text-sm font-medium text-zinc-900">Drop a PDF or TXT here, or click to choose</span>
      <span className="mt-1 text-xs text-zinc-500">Up to 5 MB. Only salted fingerprints go on-chain.</span>
      <input
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
```

`components/step-timeline.tsx`:
```tsx
export type StepState = "pending" | "active" | "done" | "error";

export interface Step {
  label: string;
  hint: string;
  state: StepState;
}

const dot: Record<StepState, string> = {
  pending: "bg-zinc-200 text-zinc-600",
  active: "bg-zinc-900 text-white animate-pulse",
  done: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
};

export function StepTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-start gap-3">
          <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${dot[step.state]}`}>
            {step.state === "done" ? "✓" : step.state === "error" ? "!" : i + 1}
          </span>
          <div>
            <p className={`text-sm font-medium ${step.state === "pending" ? "text-zinc-500" : "text-zinc-900"}`}>
              {step.label}
              <span className="sr-only"> — {step.state}</span>
            </p>
            <p className="text-xs text-zinc-500">{step.hint}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

`components/risk-score.tsx`:
```tsx
export function RiskScore({ score }: { score: number }) {
  const tone = score >= 60 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums">{score}</span>
        <span className="text-sm text-zinc-500">/ 100 risk</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-zinc-100" role="meter" aria-label="Risk score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the page**

`app/new/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Dropzone } from "@/components/dropzone";
import { RiskScore } from "@/components/risk-score";
import { StepTimeline, type StepState } from "@/components/step-timeline";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { formatBytes } from "@/lib/format";
import type { PublicProof } from "@/lib/public-proof";

const STEPS = [
  { label: "Analyze with AI", hint: "Demo AI reviews the document and scores its risk." },
  { label: "Hash with a secret salt", hint: "We fingerprint the document, the answer and the metadata." },
  { label: "Record on Solana", hint: "The fingerprints join your tamper-evident history." },
];

type Phase = "idle" | "working" | "done" | "error";
type Created = { proof: PublicProof; chainError: string | null };

export default function NewProofPage() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function useSample() {
    setError(null);
    try {
      const res = await fetch("/sample-contract.txt");
      const blob = await res.blob();
      setFile(new File([blob], "sample-contract.txt", { type: "text/plain" }));
    } catch {
      setError("Couldn't load the sample. Check your connection and try again.");
    }
  }

  async function submit() {
    if (!file) return;
    setPhase("working");
    setActive(0);
    setError(null);
    setCreated(null);
    const timer = setInterval(() => setActive((s) => Math.min(s + 1, STEPS.length - 1)), 700);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/proofs", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
      setCreated(body as Created);
      setPhase("done");
    } catch (e) {
      setError(e instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : e instanceof Error ? e.message : String(e));
      setPhase("error");
    } finally {
      clearInterval(timer);
    }
  }

  function reset() {
    setFile(null);
    setPhase("idle");
    setCreated(null);
    setError(null);
    setActive(0);
  }

  function stepState(i: number): StepState {
    if (phase === "done") return created?.chainError && i === 2 ? "error" : "done";
    if (phase === "error") return i < active ? "done" : i === active ? "error" : "pending";
    if (phase === "working") return i < active ? "done" : i === active ? "active" : "pending";
    return "pending";
  }

  const shareUrl = created && typeof window !== "undefined" ? `${window.location.origin}/proof/${created.proof.id}` : "";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create a proof</h1>
          <p className="mt-1 text-sm text-zinc-600">Upload a document. We&apos;ll analyze it and record a tamper-evident proof.</p>
        </div>
        <Badge tone="warning">Demo AI (mock)</Badge>
      </header>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-4 md:col-span-3">
          {phase !== "done" && (
            <Card>
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-zinc-500">{formatBytes(file.size)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setFile(null)} disabled={phase === "working"}>
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Dropzone onFile={(f) => { setFile(f); setError(null); }} />
                  <p className="mt-3 text-sm text-zinc-600">
                    No file at hand?{" "}
                    <button type="button" onClick={useSample} className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
                      Try the sample contract
                    </button>
                  </p>
                </>
              )}
              {error && (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {error}
                </div>
              )}
              <Button className="mt-4 w-full sm:w-auto" onClick={submit} disabled={!file || phase === "working"}>
                {phase === "working" ? "Creating proof…" : phase === "error" ? "Try again" : "Analyze & create proof"}
              </Button>
            </Card>
          )}

          {phase === "done" && created && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-500">Proof #{created.proof.sequence ?? "—"}</p>
                  <h2 className="text-lg font-semibold">{created.chainError ? "Saved — not on Solana yet" : "Recorded on Solana"}</h2>
                </div>
                <Badge tone={created.chainError ? "warning" : "success"}>{created.chainError ? "Pending" : "Verified"}</Badge>
              </div>
              {created.chainError && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  We couldn&apos;t reach Solana ({created.chainError}). Your proof is saved — retry from its page.
                </p>
              )}
              {created.proof.output && (
                <div className="mt-5 space-y-3">
                  <RiskScore score={created.proof.output.riskScore} />
                  {created.proof.output.issues.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {created.proof.output.issues.map((issue) => (
                        <li key={issue}>
                          <Badge>{issue}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink href={`/proof/${created.proof.id}`}>Open proof page</ButtonLink>
                <CopyButton value={shareUrl} label="Copy share link" variant="secondary" />
                <Button variant="ghost" onClick={reset}>
                  Create another
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Card title="What happens" className="md:col-span-2">
          <StepTimeline steps={STEPS.map((s, i) => ({ ...s, state: stepState(i) }))} />
        </Card>
      </div>
    </div>
  );
}
```

> The function is named `useSample` for readability, but it is not a React hook. If ESLint's hooks rule is added later, rename it to `loadSample`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dropzone.tsx components/step-timeline.tsx components/risk-score.tsx app/new
git commit -m "feat(ui): add create-proof flow with drag-and-drop, sample file and progress steps" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Proof page (`/proof/[id]`)

**Files:**
- Create: `components/verdict-banner.tsx`, `components/checks-list.tsx`, `components/demo-panel.tsx`, `app/proof/[id]/page.tsx`, `app/proof/[id]/proof-view.tsx`

- [ ] **Step 1: Write the components**

`components/verdict-banner.tsx`:
```tsx
import { verdictText } from "@/lib/verification-text";
import type { VerificationResult } from "@/lib/verifier";

const tone = {
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-950",
  FAILED: "border-red-200 bg-red-50 text-red-950",
  NOT_ON_CHAIN: "border-amber-200 bg-amber-50 text-amber-950",
} as const;

const icon = { VERIFIED: "✓", FAILED: "✕", NOT_ON_CHAIN: "…" } as const;
const iconTone = { VERIFIED: "text-emerald-600", FAILED: "text-red-600", NOT_ON_CHAIN: "text-amber-600" } as const;

export function VerdictBanner({ result }: { result: VerificationResult | null }) {
  if (!result) return <div className="h-24 animate-pulse rounded-xl bg-zinc-100" aria-label="Verifying against Solana" />;
  const text = verdictText(result);
  return (
    <div role="status" className={`flex gap-4 rounded-xl border p-5 ${tone[result.status]}`}>
      <div aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-bold shadow-sm ${iconTone[result.status]}`}>
        {icon[result.status]}
      </div>
      <div>
        <p className="text-lg font-semibold">{text.title}</p>
        <p className="mt-1 text-sm">{text.body}</p>
      </div>
    </div>
  );
}
```

`components/checks-list.tsx`:
```tsx
import type { HashCheck, VerificationResult } from "@/lib/verifier";

function Row({ ok, label, detail, children }: { ok: boolean; label: string; detail: string; children?: React.ReactNode }) {
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span aria-hidden className={`mt-0.5 text-sm font-bold ${ok ? "text-emerald-600" : "text-red-600"}`}>
          {ok ? "✓" : "✕"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-medium">{label}</p>
            <p className={`text-sm ${ok ? "text-zinc-600" : "font-medium text-red-700"}`}>{detail}</p>
          </div>
          {children}
        </div>
      </div>
    </li>
  );
}

function HashDetails({ check }: { check: HashCheck }) {
  return (
    <dl className="mt-2 grid gap-1 rounded-md bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600">
      <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
        <dt className="font-sans text-zinc-500">On Solana</dt>
        <dd className="break-all">{check.stored}</dd>
      </div>
      <div className="grid gap-1 sm:grid-cols-[7rem_1fr]">
        <dt className="font-sans text-zinc-500">Recomputed now</dt>
        <dd className={`break-all ${check.ok ? "" : "rounded bg-red-100 px-1 text-red-800"}`}>{check.current}</dd>
      </div>
    </dl>
  );
}

export function ChecksList({ result, showTechnical }: { result: VerificationResult; showTechnical: boolean }) {
  if (result.status === "NOT_ON_CHAIN") {
    return <p className="text-sm text-zinc-600">Checks appear once the proof is recorded on Solana.</p>;
  }
  const { checks } = result;
  const hash = (check: HashCheck, label: string) => (
    <Row ok={check.ok} label={label} detail={check.ok ? "Unchanged since recording" : "Changed after recording"}>
      {showTechnical && <HashDetails check={check} />}
    </Row>
  );
  return (
    <ul className="divide-y divide-zinc-100">
      {hash(checks.input, "Document")}
      {hash(checks.output, "AI output")}
      {hash(checks.metadata, "Metadata · model, time, agent")}
      <Row ok={checks.record.ok} label="Record integrity" detail={checks.record.ok ? "Consistent" : "Inconsistent on Solana"} />
      <Row
        ok={checks.chain.ok}
        label="Place in history"
        detail={checks.chain.ok ? (checks.chain.sequence === 0 ? "First record in the history" : `Linked to record #${checks.chain.sequence - 1}`) : "Link to the previous record is broken"}
      />
      <Row ok={checks.issuer.ok} label="Issuer" detail={checks.issuer.ok ? "Expected issuer" : "Unexpected issuer"}>
        {showTechnical && <p className="mt-2 break-all font-mono text-[11px] text-zinc-500">{checks.issuer.onChain}</p>}
      </Row>
    </ul>
  );
}
```

`components/demo-panel.tsx`:
```tsx
import { Button } from "./ui/button";

export function DemoPanel(props: {
  isTampered: boolean;
  canEditContent: boolean;
  busy: boolean;
  confirmDelete: boolean;
  onTamper: () => void;
  onRestore: () => void;
  onAskDelete: (ask: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <section aria-labelledby="demo-title" className="rounded-xl border-2 border-dashed border-zinc-300 p-5">
      <h2 id="demo-title" className="text-sm font-semibold">
        Demo: simulate an attack
      </h2>
      <p className="mt-1 text-sm text-zinc-600">These buttons edit our database like a dishonest insider would. Solana stays untouched — watch the checks react.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {props.canEditContent && (
          <>
            <Button variant="secondary" onClick={props.onTamper} disabled={props.busy || props.isTampered}>
              Change the AI output
            </Button>
            <Button variant="secondary" onClick={props.onRestore} disabled={props.busy || !props.isTampered}>
              Restore original
            </Button>
          </>
        )}
        {!props.confirmDelete ? (
          <Button variant="danger" onClick={() => props.onAskDelete(true)} disabled={props.busy}>
            Delete this record from the database…
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
            <span>Delete it? The record stays on Solana, so the history will show a gap.</span>
            <Button variant="danger" onClick={props.onDelete} disabled={props.busy}>
              Yes, delete
            </Button>
            <Button variant="ghost" onClick={() => props.onAskDelete(false)} disabled={props.busy}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the page**

`app/proof/[id]/page.tsx`:
```tsx
import { getChainMode } from "@/lib/config";
import { ProofView } from "./proof-view";

export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProofView id={id} chainMode={getChainMode()} />;
}
```

`app/proof/[id]/proof-view.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChecksList } from "@/components/checks-list";
import { DemoPanel } from "@/components/demo-panel";
import { RiskScore } from "@/components/risk-score";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { VerdictBanner } from "@/components/verdict-banner";
import type { ChainMode } from "@/lib/config";
import { formatIso, formatUtc, shortHash } from "@/lib/format";
import type { PublicProof } from "@/lib/public-proof";
import type { VerificationResult } from "@/lib/verifier";

type Busy = null | "load" | "tamper" | "restore" | "delete" | "retry";

export function ProofView({ id, chainMode }: { id: string; chainMode: ChainMode }) {
  const router = useRouter();
  const [proof, setProof] = useState<PublicProof | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<Busy>("load");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const load = useCallback(async () => {
    const [p, v] = await Promise.all([fetch(`/api/proofs/${id}`), fetch(`/api/proofs/${id}/verify`)]);
    if (p.status === 404) {
      setNotFound(true);
      return;
    }
    const pj = await p.json();
    const vj = await v.json();
    if (!p.ok) throw new Error(pj.error ?? "Couldn't load this proof.");
    if (!v.ok) throw new Error(vj.error ?? "Couldn't verify this proof.");
    setProof(pj.proof);
    setResult(vj.result);
  }, [id]);

  const run = useCallback(
    async (kind: Exclude<Busy, null>, action?: "tamper" | "restore" | "retry") => {
      setBusy(kind);
      setError(null);
      try {
        if (action) {
          const res = await fetch(`/api/proofs/${id}/${action}`, { method: "POST" });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
          if (body.chainError) setError(`Couldn't record on Solana: ${body.chainError}`);
        }
        setResult(null);
        await load();
      } catch (e) {
        setError(e instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(null);
      }
    },
    [id, load],
  );

  useEffect(() => {
    void run("load");
  }, [run]);

  async function deleteRecord() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/proofs/${id}/delete`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't delete this record.");
      router.push(body.sequence !== null && body.sequence !== undefined ? `/history?highlight=${body.sequence}` : "/history");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  if (notFound) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h1 className="text-lg font-semibold">Proof not found</h1>
        <p className="mt-2 text-sm text-zinc-600">It doesn&apos;t exist or its data was deleted from the database. The history shows what&apos;s on Solana.</p>
        <div className="mt-5 flex justify-center gap-2">
          <ButtonLink href="/history">Open history</ButtonLink>
          <ButtonLink href="/new" variant="secondary">
            Create a proof
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (!proof) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-100" />
        <VerdictBanner result={null} />
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/proof/${proof.id}` : "";
  const canDownload = proof.mode === "full" && proof.status === "ANCHORED";
  const title = proof.sequence !== null ? `Proof #${proof.sequence}` : "Proof (not on Solana yet)";

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/history" className="hover:text-zinc-900">
          History
        </Link>{" "}
        › <span className="text-zinc-900">{title}</span>
      </nav>

      <VerdictBanner result={busy === "load" && !result ? null : result} />

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {proof.status === "PENDING_CHAIN" && (
          <Button onClick={() => run("retry", "retry")} disabled={busy !== null}>
            {busy === "retry" ? "Recording…" : "Retry recording on Solana"}
          </Button>
        )}
        <CopyButton value={shareUrl} label="Copy share link" variant="secondary" />
        {canDownload ? (
          <a href={`/api/proofs/${proof.id}/evidence`} download className={buttonClass("secondary", "px-3 py-1.5")}>
            Download evidence
          </a>
        ) : null}
        {canDownload && chainMode === "anchor" && (
          <a href="/verifier.html" target="_blank" rel="noopener" className={buttonClass("secondary", "px-3 py-1.5")}>
            Open independent verifier ↗
          </a>
        )}
        <Button variant="ghost" onClick={() => run("load")} disabled={busy !== null}>
          {busy === "load" ? "Verifying…" : "Re-verify"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card
            title="Checks"
            action={
              <button type="button" onClick={() => setShowTechnical((v) => !v)} className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900" aria-expanded={showTechnical}>
                {showTechnical ? "Hide technical details" : "Show technical details"}
              </button>
            }
          >
            {result ? <ChecksList result={result} showTechnical={showTechnical} /> : <div className="h-40 animate-pulse rounded bg-zinc-50" />}
          </Card>

          {proof.output && (
            <Card title="AI result" action={proof.isTampered ? <Badge tone="danger">Changed copy</Badge> : <Badge tone="warning">Demo AI (mock)</Badge>}>
              <RiskScore score={proof.output.riskScore} />
              {proof.output.issues.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {proof.output.issues.map((issue) => (
                    <li key={issue}>
                      <Badge>{issue}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm text-zinc-600">{proof.output.summary}</p>
            </Card>
          )}
          {proof.mode === "hashes" && (
            <Card title="Content">
              <p className="text-sm text-zinc-600">This is a hash-only proof: the issuer keeps the content. Ask them for the original to check it against these fingerprints.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-3 text-sm">
              <Detail label="Record">{proof.sequence !== null ? `#${proof.sequence}` : "Not recorded yet"}</Detail>
              <Detail label="Recorded">{proof.chainTimestamp !== null ? formatUtc(proof.chainTimestamp) : "—"}</Detail>
              <Detail label="Created">{formatIso(proof.createdAt)}</Detail>
              {proof.inputFileName && <Detail label="File">{proof.inputFileName}</Detail>}
              {proof.model && (
                <Detail label="Model">
                  {proof.model}
                  <span className="block text-xs text-zinc-500">declared by the issuer</span>
                </Detail>
              )}
              {result?.checks.issuer.expected && (
                <Detail label="Issuer">
                  <span className="font-mono text-xs">{shortHash(result.checks.issuer.expected)}</span>
                </Detail>
              )}
              {proof.explorerUrl && (
                <Detail label="Transaction">
                  <a href={proof.explorerUrl} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-zinc-600">
                    View on Explorer ↗
                  </a>
                </Detail>
              )}
            </dl>
          </Card>
          <Card title="What this proves">
            <p className="text-sm text-zinc-600">
              The data hasn&apos;t changed since it was recorded, the record can&apos;t be backdated or silently removed from the history. It doesn&apos;t prove the issuer recorded the truth.{" "}
              <Link href="/#limits" className="underline underline-offset-2">
                Details
              </Link>
            </p>
          </Card>
        </div>
      </div>

      <DemoPanel
        isTampered={proof.isTampered}
        canEditContent={proof.mode === "full"}
        busy={busy !== null}
        confirmDelete={confirmDelete}
        onTamper={() => run("tamper", "tamper")}
        onRestore={() => run("restore", "restore")}
        onAskDelete={setConfirmDelete}
        onDelete={deleteRecord}
      />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 break-words text-zinc-900">{children}</dd>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/verdict-banner.tsx components/checks-list.tsx components/demo-panel.tsx app/proof
git commit -m "feat(ui): add proof page with verdict, checks, details and demo attacks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: History page (`/history`)

**Files:**
- Create: `app/history/page.tsx`, `app/history/history-view.tsx`

- [ ] **Step 1: Write the page**

`app/history/page.tsx`:
```tsx
import { HistoryView } from "./history-view";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ highlight?: string }> }) {
  const { highlight } = await searchParams;
  const n = highlight !== undefined && /^\d+$/.test(highlight) ? Number(highlight) : null;
  return <HistoryView highlight={n} />;
}
```

`app/history/history-view.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, type Tone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { formatUtc, shortHash } from "@/lib/format";
import type { AuditStatus, HistoryAudit } from "@/lib/history-audit";

const STATUS: Record<AuditStatus, { tone: Tone; label: string; explain?: string }> = {
  OK: { tone: "success", label: "Intact" },
  HASH_ONLY: { tone: "info", label: "Hash only", explain: "The issuer keeps the content; only fingerprints are recorded." },
  MISSING_IN_DATABASE: { tone: "danger", label: "Deleted", explain: "This record is on Solana, but its data was deleted from the database." },
  DATA_MODIFIED: { tone: "danger", label: "Data changed", explain: "The stored data no longer matches the fingerprint on Solana." },
  CHAIN_BROKEN: { tone: "danger", label: "Link broken", explain: "This record doesn't link correctly to the previous one." },
};

export function HistoryView({ highlight }: { highlight: number | null }) {
  const [audit, setAudit] = useState<HistoryAudit | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history/audit")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load the history.");
        setAudit(body.audit);
      })
      .catch((e) => setError(e instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : e.message));
  }, []);

  useEffect(() => {
    if (audit && highlight !== null) document.getElementById(`record-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [audit, highlight]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-zinc-600">Every proof your issuer has recorded, in order. Gaps and edits show up here.</p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!audit && !error && <div className="h-20 animate-pulse rounded-xl bg-zinc-100" aria-label="Loading history" />}

      {audit && audit.total === 0 && (
        <Card className="text-center">
          <h2 className="text-lg font-semibold">No proofs yet</h2>
          <p className="mt-1 text-sm text-zinc-600">Your first proof will appear here as record #0.</p>
          <ButtonLink href="/new" className="mt-5">
            Create your first proof
          </ButtonLink>
        </Card>
      )}

      {audit && audit.total > 0 && (
        <>
          <div
            role="status"
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-5 ${audit.problems ? "border-red-200 bg-red-50 text-red-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}
          >
            <p className="font-semibold">
              {audit.problems
                ? `✕ ${audit.problems} problem${audit.problems > 1 ? "s" : ""} found in ${audit.total} records`
                : `✓ All ${audit.total} records intact`}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-zinc-600">Issuer</span>
              <span className="font-mono text-xs">{shortHash(audit.issuer)}</span>
              <CopyButton value={audit.issuer} />
            </div>
          </div>

          {audit.pendingInDatabase > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {audit.pendingInDatabase} proof{audit.pendingInDatabase > 1 ? "s are" : " is"} saved but not on Solana yet. Open {audit.pendingInDatabase > 1 ? "them" : "it"} from a direct link to retry.
            </p>
          )}

          <Card className="p-0">
            <ol className="divide-y divide-zinc-100">
              {audit.entries.map((entry) => {
                const s = STATUS[entry.status];
                const highlighted = entry.sequence === highlight;
                return (
                  <li key={entry.sequence} id={`record-${entry.sequence}`} className={`px-5 py-4 ${highlighted ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : ""}`}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="w-10 font-mono text-sm text-zinc-500">#{entry.sequence}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {entry.status === "MISSING_IN_DATABASE" ? <span className="text-zinc-400">— deleted —</span> : entry.fileName ?? (entry.status === "HASH_ONLY" ? "Hash-only proof" : "Proof")}
                      </span>
                      <span className="text-xs text-zinc-500">{entry.timestamp !== null ? formatUtc(entry.timestamp) : "—"}</span>
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {entry.dbId ? (
                        <Link href={`/proof/${entry.dbId}`} className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600">
                          View
                        </Link>
                      ) : (
                        <span className="w-9" />
                      )}
                    </div>
                    {s.explain && <p className={`mt-1 pl-14 text-xs ${s.tone === "danger" ? "text-red-700" : "text-zinc-500"}`}>{s.explain}</p>}
                  </li>
                );
              })}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/history
git commit -m "feat(ui): add history page with audit summary and problem explanations" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: UX QA in the browser

**Files:**
- Create: `.claude/launch.json`
- Modify: any UI file where QA finds a defect

- [ ] **Step 1: Add the preview config**

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "proofapi-dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }
  ]
}
```
If the preview fails to spawn `npm` on Windows, change `runtimeExecutable` to `npm.cmd`.

- [ ] **Step 2: Reset data and start the preview**

Run: `npm run db:reset`, then start the `proofapi-dev` preview (Browser pane `preview_start`).

- [ ] **Step 3: Walk the UX checklist (spec UX §8) and fix what fails**

1. `/` → «Create your first proof» → `/new` → «Try the sample contract» → «Analyze & create proof». Expected: steps animate, result card shows «Proof #0», 31/100, three issue badges.
2. «Open proof page». Expected: green **Verified** banner with the date; six green checks; «Show technical details» reveals hashes.
3. «Change the AI output». Expected: red banner «The AI output was changed after it was recorded.»; AI result card shows «Changed copy» and 5/100; output check red with highlighted recomputed hash.
4. «Restore original». Expected: green again.
5. Create two more proofs, open the middle one, «Delete this record from the database…» → «Yes, delete». Expected: redirect to `/history?highlight=1`, row #1 highlighted as «Deleted» with the explanation; summary «1 problem found in 3 records».
6. Keyboard: Tab through `/new` and `/proof/[id]`; every control shows a focus ring and works with Enter or Space.
7. Resize to 375 px wide (`resize_window` preset `mobile`). Expected: no horizontal scroll on `/`, `/new`, `/proof/[id]`, `/history`. Reset with preset `desktop`.
8. Stop the server, click «Re-verify». Expected: the red alert «Couldn't reach the server…»; restart the server.

Fix any defect in the relevant component, then rerun the affected steps.

- [ ] **Step 4: Final checks**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: all tests pass, no type errors, build compiles.

- [ ] **Step 5: Commit**

```bash
git add .claude/launch.json app components
git commit -m "chore: add preview config and UX QA fixes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope for Plan A (covered by Plan B)

- Anchor program `proof_registry` (Rust) and its Playground tests.
- `lib/solana/encoding.ts`, `AnchorChainClient`, `CHAIN_MODE=anchor`.
- `npm run setup` / `npm run register-issuer` key scripts.
- `public/verifier.html` independent verifier.
- End-to-end run on devnet.
