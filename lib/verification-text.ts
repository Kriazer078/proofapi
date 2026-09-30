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
