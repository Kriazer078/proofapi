"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Panel } from "@/components/ui";
import { formatBytes } from "@/lib/format";

const STEPS = ["Reading the document", "AI analysis", "Fingerprinting", "Recording on Solana"];
const MAX_BYTES = 5 * 1024 * 1024;

type Phase = { kind: "idle" } | { kind: "working"; step: number; name: string } | { kind: "error"; message: string };

export default function NewProofPage() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);

  // Walk the step list while the single request runs; the last step waits for Solana.
  useEffect(() => {
    if (phase.kind !== "working" || phase.step >= STEPS.length - 1) return;
    const t = setTimeout(() => setPhase({ ...phase, step: phase.step + 1 }), 550);
    return () => clearTimeout(t);
  }, [phase]);

  async function submit(file: File) {
    if (file.size > MAX_BYTES) {
      setPhase({ kind: "error", message: `${file.name} is ${formatBytes(file.size)}. The limit is 5 MB.` });
      return;
    }
    setPhase({ kind: "working", step: 0, name: file.name });
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/proofs", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      router.push(`/proof/${json.proof.id}`);
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function useSample() {
    const text = await fetch("/sample-contract.txt").then((r) => r.text());
    submit(new File([text], "sample-contract.txt", { type: "text/plain" }));
  }

  const working = phase.kind === "working";

  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">New proof</h1>
      <p className="mt-3 text-muted">The AI reviews your contract. Its answer is fingerprinted and recorded on Solana.</p>

      {!working ? (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) submit(f);
            }}
            className={`ring-sol mt-10 flex cursor-pointer flex-col items-center rounded-2xl bg-panel/80 px-6 py-16 text-center transition-colors ${dragging ? "bg-sol-purple/10" : "hover:bg-panel-2"}`}
          >
            <span className="grid size-12 place-items-center rounded-xl border border-line-strong bg-bg text-fg">
              <Icon name="upload" className="size-5" />
            </span>
            <span className="mt-5 font-medium">Drop a PDF or TXT here, or click to choose</span>
            <span className="mt-1 text-sm text-faint">Up to 5 MB</span>
            <input
              ref={input}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) submit(f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <span className="text-faint">No contract at hand?</span>
            <Button variant="ghost" onClick={useSample}>
              <Icon name="file" />
              Use the sample contract
            </Button>
          </div>
          {phase.kind === "error" && (
            <p role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {phase.message}
            </p>
          )}
          <p className="mt-10 text-xs text-faint">The AI in this demo is simulated. Fingerprints and the Solana record are real.</p>
        </>
      ) : (
        <Panel className="mt-10 p-6" aria-live="polite">
          <div className="flex items-center gap-3 text-sm">
            <Icon name="file" className="size-4 text-muted" />
            <span className="font-medium">{phase.name}</span>
          </div>
          <ol className="mt-6 grid gap-4">
            {STEPS.map((label, i) => {
              const state = i < phase.step ? "done" : i === phase.step ? "active" : "todo";
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid size-6 place-items-center rounded-full border ${
                      state === "done" ? "border-ok/40 bg-ok/15 text-ok" : state === "active" ? "border-sol-purple/60 text-fg" : "border-line-strong text-faint"
                    }`}
                  >
                    {state === "done" ? <Icon name="check" className="size-3.5" /> : state === "active" ? <span className="size-2 rounded-full bg-sol-green animate-pulse-dot" /> : null}
                  </span>
                  <span className={state === "todo" ? "text-faint" : "text-fg"}>{label}</span>
                  {state === "active" && i === STEPS.length - 1 && <span className="text-xs text-faint">waiting for confirmation…</span>}
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
    </div>
  );
}
