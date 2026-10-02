import type React from "react";
import { Check } from "lucide-react";
import type { HeroCopy } from "@/lib/i18n/hero";

/** Static picture of a certificate page, used as the product shot on the home page. */
export function HeroShot({ copy }: { copy: HeroCopy["shot"] }) {
  return (
    <figure className="hero-stage mx-auto mt-14 w-full max-w-[1100px] lg:mt-16">
      <figcaption className="sr-only">{copy.alt}</figcaption>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-[14px] bg-surface shadow-[0_0_0_1px_var(--border),0_30px_80px_-20px_rgb(0_0_0/0.8)]"
      >
        <div className="flex h-11 items-center gap-3.5 border-b bg-surface-muted/60 px-4">
          <div className="flex gap-1.5">
            <i className="size-2.5 rounded-full bg-border" />
            <i className="size-2.5 rounded-full bg-border" />
            <i className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="mx-auto flex h-[26px] w-full max-w-[360px] items-center justify-center rounded-md bg-surface-muted text-xs text-text-muted">
            proofapi.vercel.app/proof/pr_8f2c
          </div>
          <div className="w-[42px]" />
        </div>
        <div className="px-5 py-6 sm:px-9 sm:py-8">
          <div className="flex items-center justify-between text-[13px] text-text-muted">
            <span>{copy.title}</span>
            <span className="font-mono">{copy.record}</span>
          </div>
          <div className="grid gap-x-10 md:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mt-6 flex items-center gap-4 border-b pb-6">
                <svg
                  className="verify-ring size-14 shrink-0"
                  viewBox="0 0 52 52"
                  fill="none"
                >
                  <circle cx="26" cy="26" r="24" strokeWidth="2" className="stroke-border" />
                  <circle cx="26" cy="26" r="24" strokeWidth="2.5" strokeLinecap="round" className="arc stroke-success" />
                  <path
                    d="M17 26.5l6 6 12-13"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="tick stroke-success"
                  />
                </svg>
                <div className="verify-verdict">
                  <p className="text-[30px] font-semibold leading-tight tracking-[-0.03em]">
                    {copy.verdict}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {copy.verdictSub}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-5 border-b py-5 sm:grid-cols-4">
                {copy.facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ul className="grid content-start gap-3 py-5 text-sm md:pt-[30px]">
              {copy.checks.map((check, i) => (
                <li key={check} className="flex items-center gap-2.5">
                  <span
                    className="verify-step"
                    style={{ "--d": `${1.2 + i * 0.3}s` } as React.CSSProperties}
                  >
                    <span className="spinner" />
                    <Check className="done size-4 text-success" strokeWidth={2.25} />
                  </span>
                  {check}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2 rounded-[10px] bg-surface-muted px-[18px] py-4 text-sm leading-relaxed text-text-secondary">
            <p className="mb-1.5 text-xs font-medium text-text-muted">
              {copy.answerLabel}
            </p>
            {copy.answer}
          </div>
        </div>
      </div>
    </figure>
  );
}
