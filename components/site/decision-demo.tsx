"use client";

import { RotateCcw, SquarePen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n";
import { SealStamp } from "@/components/seal-stamp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** First 16 hex characters of the real SHA-256, in four blocks people can compare by eye. */
const blocks = (hex: string) => (hex ? hex.slice(0, 16).toUpperCase().match(/.{4}/g)! : ["····", "····", "····", "····"]);

/** The signature interaction: edit the AI decision and the credential re-presses its seal in red. */
export function DecisionDemo() {
  const { t } = useI18n();
  const d = t.lp.demo;
  const deny = useMemo(() => d.original.match(/(denied|отказ|бас тарту)/)?.[0] ?? "", [d.original]);
  const approve = { denied: "approved", отказ: "одобрено", "бас тарту": "мақұлданды" }[deny] ?? deny;
  const [text, setText] = useState(d.original);
  const [recorded, setRecorded] = useState("");
  const [current, setCurrent] = useState("");

  useEffect(() => {
    setText(d.original);
    sha256(d.original).then(setRecorded);
  }, [d.original]);
  useEffect(() => {
    sha256(text).then(setCurrent);
  }, [text]);

  const ready = recorded !== "" && current !== "";
  const match = ready && recorded === current;
  const rec = blocks(recorded);
  const now = blocks(current);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sheet)]">
        <Label htmlFor="decision-text" className="text-sm text-muted-foreground">
          {d.label}
        </Label>
        <textarea
          id="decision-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          spellCheck={false}
          className="mt-3 w-full resize-y rounded-lg border border-input bg-background p-4 font-display text-lg leading-relaxed text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="md" className="bg-card" onClick={() => setText(text.replace(deny, approve))} disabled={!deny || !text.includes(deny)}>
            <SquarePen />
            {d.fake}
          </Button>
          <Button variant="ghost" size="md" onClick={() => setText(d.original)} disabled={text === d.original}>
            <RotateCcw />
            {d.restore}
          </Button>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col justify-between gap-6 rounded-xl border bg-card p-6 shadow-[var(--shadow-sheet)] transition-colors ${match || !ready ? "border-border" : "border-destructive/40"}`}
      >
        <div className="flex items-center gap-4">
          <SealStamp state={!ready ? "checking" : match ? "ok" : "bad"} word={match ? t.mk.seal.genuine : t.mk.seal.changed} ring={t.mk.seal.ring} size={92} />
          <div>
            <strong className={`block font-display text-3xl font-medium ${match ? "text-seal" : "text-destructive"}`}>{match ? d.genuine : d.changed}</strong>
            <p className="mt-1 text-sm text-muted-foreground">{match ? d.genuineText : d.changedText}</p>
          </div>
        </div>
        <div className="grid gap-3 font-mono text-sm">
          {[
            { label: d.recorded, codes: rec, compare: undefined },
            { label: d.now, codes: now, compare: rec },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 font-sans text-xs text-faint">{row.label}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {row.codes.map((c, i) => {
                  const differs = row.compare !== undefined && ready && row.compare[i] !== c;
                  return (
                    <span key={i} className={`rounded-md border px-2 py-1 text-center transition-colors ${differs ? "border-destructive/40 bg-bad-soft text-destructive" : "border-border text-muted-foreground"}`}>
                      {c}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
