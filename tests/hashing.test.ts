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
