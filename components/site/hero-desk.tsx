import { SealStamp } from "@/components/seal-stamp";
import type { Messages } from "@/lib/i18n/messages";

/** The first-viewport object: an AI agent's decision on paper with a ProofAPI credential pressed onto it. */
export function HeroDesk({ t }: { t: Messages }) {
  const h = t.lp.hero;
  return (
    <div className="relative pb-0 sm:pb-16" aria-label={h.example}>
      <span className="absolute -top-3 right-[14%] z-10 rounded border border-border bg-background px-2 py-1 font-mono text-[11px] tracking-wide text-faint uppercase">
        {h.example}
      </span>
      <article className="relative w-full rounded-md border border-border bg-card p-6 shadow-[var(--shadow-sheet)] sm:w-[88%] sm:p-8">
        <header className="flex items-baseline justify-between gap-3 border-b border-border pb-3.5">
          <h2 className="font-display text-xl font-medium">{h.doc.title}</h2>
          <span className="font-mono text-xs text-faint">{h.doc.number}</span>
        </header>
        <dl className="mt-4 grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px]">
          {h.doc.rows.map(([k, v], i) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={i === 1 ? "font-semibold text-destructive" : i === 3 ? "font-mono text-sm" : ""}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-2" aria-hidden="true">
          {[92, 78, 85, 40].map((w) => (
            <span key={w} className="block h-[7px] rounded bg-border" style={{ width: `${w}%` }} />
          ))}
        </div>
      </article>

      <aside className="relative -mt-6 ml-auto w-full max-w-[340px] rounded-xl border border-border bg-card p-4 pb-3 shadow-[var(--shadow-lift)] sm:absolute sm:right-0 sm:bottom-0 sm:mt-0">
        <div className="flex items-center gap-3.5">
          <SealStamp state="ok" word={t.mk.seal.genuine} ring={t.mk.seal.ring} size={70} />
          <div>
            <strong className="block font-display text-2xl leading-tight font-medium text-seal">{h.cred.genuine}</strong>
            <small className="text-[13px] text-muted-foreground">{h.cred.sealed}</small>
          </div>
        </div>
        <dl className="mt-3 text-[13px]">
          {h.cred.rows.map(([k, v], i) => (
            <div key={k} className="flex justify-between gap-3 border-t border-dashed border-border py-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={i < 2 ? "font-medium text-seal" : "font-mono"}>{v}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-input bg-card px-3 py-2 font-mono text-xs text-muted-foreground sm:absolute sm:bottom-5 sm:left-[6%] sm:mt-0">
        <i className="size-[7px] rounded-full bg-seal" aria-hidden="true" />
        {h.cred.chip}
      </span>
    </div>
  );
}
