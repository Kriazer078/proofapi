"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Icon, Panel } from "@/components/ui";
import { formatBytes } from "@/lib/format";

const MAX_BYTES = 5 * 1024 * 1024;

type Phase = { kind: "idle" } | { kind: "working"; step: number; name: string } | { kind: "error"; message: string };

export default function NewProofPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const steps = t.create.steps;

  // Walk the steps while the single request runs; the last step waits for the blockchain.
  useEffect(() => {
    if (phase.kind !== "working" || phase.step >= steps.length - 1) return;
    const timer = setTimeout(() => setPhase({ ...phase, step: phase.step + 1 }), 600);
    return () => clearTimeout(timer);
  }, [phase, steps.length]);

  async function submit(file: File) {
    if (file.size > MAX_BYTES) {
      setPhase({ kind: "error", message: t.create.tooBig(file.name, formatBytes(file.size)) });
      return;
    }
    setPhase({ kind: "working", step: 0, name: file.name });
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/proofs", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t.errors.generic);
      router.push(`/proof/${json.proof.id}`);
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : t.errors.generic });
    }
  }

  async function useSample() {
    const text = await fetch("/sample-contract.txt").then((r) => r.text());
    submit(new File([text], "sample-contract.txt", { type: "text/plain" }));
  }

  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">{t.create.title}</h1>
      <p className="mt-3 text-lg text-muted">{t.create.lead}</p>

      {phase.kind !== "working" ? (
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
            className={`ring-sol mt-10 flex cursor-pointer flex-col items-center rounded-2xl px-6 py-14 text-center transition-colors ${dragging ? "bg-sol-purple/10" : "bg-panel/80 hover:bg-panel-2"}`}
          >
            <span className="grid size-14 place-items-center rounded-2xl border border-line-strong bg-bg text-fg">
              <Icon name="upload" className="size-6" />
            </span>
            <span className="mt-5 text-lg font-medium">{t.create.drop}</span>
            <span className="mt-4 inline-flex h-10 items-center rounded-lg bg-fg px-5 text-sm font-medium text-bg">{t.create.choose}</span>
            <span className="mt-3 text-sm text-faint">PDF, TXT · {t.create.limit}</span>
            <input
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

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted">
            <span>{t.create.sampleQ}</span>
            <button type="button" onClick={useSample} className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              {t.create.sample}
            </button>
          </div>

          {phase.kind === "error" && (
            <p role="alert" className="mt-6 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {phase.message}
            </p>
          )}
          <p className="mt-12 text-center text-xs text-faint">{t.create.note}</p>
        </>
      ) : (
        <Panel className="mt-10 p-7" aria-live="polite">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Icon name="file" />
            <span className="font-medium text-fg">{phase.name}</span>
          </div>
          <ol className="mt-7 grid gap-5">
            {steps.map((label, i) => {
              const state = i < phase.step ? "done" : i === phase.step ? "active" : "todo";
              return (
                <li key={label} className="flex items-center gap-4">
                  <span
                    className={`grid size-8 place-items-center rounded-full border ${
                      state === "done" ? "border-ok/40 bg-ok/15 text-ok" : state === "active" ? "border-sol-purple/60" : "border-line-strong"
                    }`}
                  >
                    {state === "done" ? <Icon name="check" /> : state === "active" ? <span className="size-2.5 rounded-full bg-sol-green animate-pulse-dot" /> : null}
                  </span>
                  <span className={`text-lg ${state === "todo" ? "text-faint" : "text-fg"}`}>{label}</span>
                  {state === "active" && i === steps.length - 1 && <span className="text-sm text-faint">{t.create.wait}</span>}
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
    </div>
  );
}
