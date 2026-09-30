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
