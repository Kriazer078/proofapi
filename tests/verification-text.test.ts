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
