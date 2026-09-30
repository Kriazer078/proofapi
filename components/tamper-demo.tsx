"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui";

const ORIGINAL = ["Contract review · NDA_Acme_v3.pdf", "Risk score        31 / 100", "Liability         no damages cap", "Termination       7 days notice", "Advice            negotiate a cap"];
const EDITED = ORIGINAL.map((l) => l.replace("31 / 100", "12 / 100"));

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hero demo: edit the AI answer and watch its fingerprint stop matching the one on Solana. Hashes are real SHA-256. */
export function TamperDemo() {
  const [edited, setEdited] = useState(false);
  const [recorded, setRecorded] = useState("");
  const [current, setCurrent] = useState("");

  useEffect(() => {
    sha256(ORIGINAL.join("\n")).then(setRecorded);
  }, []);
  useEffect(() => {
    sha256((edited ? EDITED : ORIGINAL).join("\n")).then(setCurrent);
  }, [edited]);

  const match = recorded !== "" && recorded === current;
  const lines = edited ? EDITED : ORIGINAL;

  return (
    <div className="ring-sol relative rounded-2xl bg-panel/90 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
      <div className="flex items-center justify-between text-xs text-faint">
        <span className="font-mono">record #42 · example</span>
        <span className="font-mono">solana devnet</span>
      </div>

      <div className="mt-4 overflow-x-auto whitespace-pre rounded-xl border border-line bg-bg/60 p-4 font-mono text-[13px] leading-6">
        {lines.map((line, i) => {
          const changed = line !== ORIGINAL[i];
          return (
            <div key={i} className={i === 0 ? "text-fg" : changed ? "-mx-1 rounded bg-bad/15 px-1 text-bad" : "text-muted"}>
              {line}
            </div>
          );
        })}
      </div>

      <dl className="mt-4 grid gap-2 text-xs">
        <div className="grid grid-cols-[88px_1fr] items-baseline gap-3">
          <dt className="text-faint">On Solana</dt>
          <dd className="font-mono text-muted break-all">{recorded.slice(0, 40) || "…"}</dd>
        </div>
        <div className="grid grid-cols-[88px_1fr] items-baseline gap-3">
          <dt className="text-faint">Right now</dt>
          <dd className="font-mono break-all">
            {current.slice(0, 40).split("").map((c, i) => (
              <span key={i} className={recorded[i] === c ? "text-muted" : "text-bad"}>
                {c}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div
        key={String(match)}
        className={`mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 ${match ? "border-ok/25 bg-ok/[0.07]" : "border-bad/30 bg-bad/[0.08] animate-shake"}`}
        role="status"
      >
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${match ? "bg-ok text-bg" : "bg-bad text-bg"}`}>
          <Icon name={match ? "check" : "x"} className="size-4" />
        </span>
        <div>
          <div className={`text-sm font-semibold ${match ? "text-ok" : "text-bad"}`}>{match ? "Verified" : "Changed after recording"}</div>
          <div className="text-xs text-muted">{match ? "Matches the fingerprint on Solana." : "The risk score was edited. The fingerprint no longer matches."}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setEdited((v) => !v)}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-sm font-medium text-fg transition-colors hover:bg-white/[0.06]"
      >
        <Icon name={edited ? "refresh" : "edit"} />
        {edited ? "Restore the original" : "Try to fake it: change 31 → 12"}
      </button>
    </div>
  );
}
