"use client";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { HeroCopy } from "@/lib/i18n/hero";
import { cn } from "@/lib/utils";

const PART =
  "col-start-1 row-start-1 transition-[opacity,transform] duration-200 ease-[var(--ease-out)]";

/** Two values in one grid cell, so swapping them cross-fades without moving the layout. */
function Swap({ on, before, after }: { on: boolean; before: string; after: string }) {
  return (
    <span className="inline-grid">
      <span aria-hidden={on} className={cn(PART, on && "-translate-y-1.5 opacity-0")}>
        {before}
      </span>
      <span aria-hidden={!on} className={cn(PART, !on && "translate-y-1.5 opacity-0")}>
        {after}
      </span>
    </span>
  );
}

/** Lets a visitor edit a sealed answer and watch the certificate catch it. Nothing leaves the browser. */
export function TamperPreview({
  copy,
  shot,
}: {
  copy: HeroCopy["tamper"];
  shot: HeroCopy["shot"];
}) {
  const [bad, setBad] = useState(false);
  return (
    <div className="min-w-0">
      <div className="rounded-[12px] border bg-surface p-5 sm:p-6">
        <div className="flex justify-between text-xs text-text-muted">
          <span>{shot.title}</span>
          <span className="font-mono">{shot.record}</span>
        </div>
        <div className="mt-4 flex items-center gap-4" aria-live="polite">
          <div
            className={cn(
              "grid size-13 shrink-0 place-items-center rounded-full transition-colors duration-200",
              bad ? "bg-danger-soft text-danger" : "bg-success-soft text-success",
            )}
          >
            {bad ? (
              <X key="x" className="pop-in size-6" strokeWidth={2.5} />
            ) : (
              <Check key="v" className="size-6" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-[26px] font-semibold leading-tight tracking-[-0.03em] transition-colors duration-200",
                bad ? "text-danger" : "text-success",
              )}
            >
              <Swap on={bad} before={shot.verdict} after={copy.changed} />
            </p>
            <p className="text-[13px] text-text-secondary">
              <Swap on={bad} before={shot.verdictSub} after={copy.changedSub} />
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-[10px] bg-surface-muted px-3.5 py-3 text-[13.5px] text-text-secondary">
          <p className="mb-1 text-[11.5px] font-medium text-text-muted">
            {shot.answerLabel}
          </p>
          {copy.answerBefore}{" "}
          <span
            className={cn(
              "rounded px-1 tabular-nums transition-colors duration-200",
              bad && "bg-danger-soft text-danger",
            )}
          >
            <Swap on={bad} before="72" after="12" />
          </span>{" "}
          {copy.answerAfter}
        </div>
        <ul className="mt-4 grid gap-2.5 border-t pt-4 text-[13.5px]">
          {copy.rows.map(([label, ok, changed], i) => {
            const failed = bad && i === 1;
            return (
              <li key={label} className="flex items-center gap-2.5">
                {failed ? (
                  <X className="pop-in size-4 shrink-0 text-danger" strokeWidth={2.25} />
                ) : (
                  <Check className="size-4 shrink-0 text-success" strokeWidth={2.25} />
                )}
                {label}
                <span
                  className={cn(
                    "ml-auto text-[12.5px] transition-colors duration-200",
                    failed ? "text-danger" : "text-text-muted",
                  )}
                >
                  {i === 1 ? <Swap on={bad} before={ok} after={changed} /> : ok}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="rounded-full"
          aria-pressed={bad}
          onClick={() => setBad(!bad)}
        >
          {bad ? copy.restore : copy.button}
        </Button>
        <span className="text-[12.5px] text-text-muted">{copy.hint}</span>
      </div>
    </div>
  );
}
