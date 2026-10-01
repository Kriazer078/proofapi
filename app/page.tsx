import { CodeBlock } from "@/components/code-block";
import { SealStamp } from "@/components/seal-stamp";
import { TamperDemo } from "@/components/tamper-demo";
import { Icon, LinkButton } from "@/components/ui";
import { CONTACT_URL } from "@/lib/i18n/marketing";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";

const CREATE_SNIPPET = `curl -F file=@contract.pdf \\
  https://proofapi.vercel.app/api/proofs`;

export default async function HomePage() {
  const { t } = await getMessages();
  const mk = t.mk;
  return (
    <>
      {/* 1. What it is + the two things you can do */}
      <section className="grid items-center gap-14 pt-16 pb-14 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="animate-fade-up">
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-balance sm:text-6xl">{t.home.title}</h1>
          <p className="mt-6 max-w-lg text-lg text-muted text-pretty">{t.home.lead}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/new" variant="primary" className="h-12 px-6 text-base">
              {t.home.ctaPrimary}
              <Icon name="arrow" />
            </LinkButton>
            <LinkButton href="/verify" className="h-12 px-6 text-base">
              {t.home.ctaSecondary}
            </LinkButton>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <ProductShot t={t} />
        </div>
      </section>

      {/* 2. How it works */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.howTitle}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {t.home.steps.map((s, i) => (
            <li key={s.title}>
              <StepPicture step={i} t={t} />
              <div className="mt-6 flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-fg text-sm font-semibold text-bg">{i + 1}</span>
                <h3 className="text-lg font-medium">{s.title}</h3>
              </div>
              <p className="mt-2 text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. A real-life story */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{mk.scenario.title}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {mk.scenario.steps.map((s, i) => (
            <li key={s.who} className="border-l-2 border-line-strong pl-5">
              <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-lg">
                <span className="font-medium">{s.who}</span> <span className="text-muted">{s.text}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Try it */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.demoTitle}</h2>
        <p className="mt-3 max-w-xl text-muted">{t.home.demoText}</p>
        <div className="mt-10">
          <TamperDemo />
        </div>
      </section>

      {/* 5. Developers */}
      <section className="grid items-center gap-10 border-t border-line py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.02em]">{mk.dev.teaserTitle}</h2>
          <p className="mt-3 max-w-md text-muted">{mk.dev.teaserText}</p>
          <LinkButton href="/developers" className="mt-8">
            {mk.dev.teaserCta}
            <Icon name="arrow" />
          </LinkButton>
        </div>
        <CodeBlock code={CREATE_SNIPPET} copyLabel={mk.dev.copy} copiedLabel={mk.dev.copied} />
      </section>

      {/* 6. Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{mk.pricing.title}</h2>
        <p className="mt-3 max-w-xl text-muted">{mk.pricing.lead}</p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {mk.pricing.plans.map((plan, i) => {
            const featured = i === 1;
            const contact = i === 2;
            return (
              <div key={plan.name} className={`flex flex-col rounded-2xl p-6 ${featured ? "ring-sol bg-panel" : "border border-line bg-panel/60"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{plan.name}</h3>
                  <span className="rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 text-xs text-ok">{mk.pricing.beta}</span>
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.price.startsWith("$") && <span className="text-muted">{mk.pricing.perMonth}</span>}
                </div>
                <ul className="mt-6 grid flex-1 gap-3 text-[15px]">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-muted">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-fg" />
                      {item}
                    </li>
                  ))}
                </ul>
                <LinkButton href={contact ? CONTACT_URL : "/new"} external={contact} variant={featured ? "primary" : "secondary"} className="mt-8 w-full">
                  {plan.cta}
                </LinkButton>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Questions */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.faqTitle}</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {t.home.faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 8. Contact */}
      <section className="flex flex-col items-start justify-between gap-8 border-t border-line pt-20 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.02em]">{mk.contact.title}</h2>
          <p className="mt-3 max-w-md text-muted">{mk.contact.text}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={CONTACT_URL} external className="h-12 px-6 text-base">
            {mk.contact.cta}
            <Icon name="external" />
          </LinkButton>
          <LinkButton href="/new" variant="primary" className="h-12 px-6 text-base">
            {t.home.ctaPrimary}
          </LinkButton>
        </div>
      </section>
    </>
  );
}

/** The real certificate page a client opens, shown in a minimal address-bar frame. */
function ProductShot({ t }: { t: Messages }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-4 py-2.5">
        <Icon name="shield" className="size-3.5 text-ok" />
        <span className="truncate font-mono text-xs text-muted">proofapi.vercel.app/proof/7Hk2xQ…</span>
        <span className="ml-auto rounded border border-line-strong px-1.5 py-0.5 text-[10px] text-faint">{t.home.example}</span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-5">
          <SealStamp state="ok" word={t.mk.seal.genuine} date="01.10.2026" ring={t.mk.seal.ring} size={96} />
          <div>
            <div className="text-3xl font-semibold tracking-tight text-ok">{t.cert.genuine}</div>
            <div className="mt-1 text-sm text-muted">{t.cert.certificate} · Acme Legal</div>
          </div>
        </div>
        <dl className="mt-6 border-t border-dashed border-line-strong text-[15px]">
          {(
            [
              [t.cert.document, "NDA_Acme_v3.pdf"],
              [t.cert.task, t.cert.taskValue],
              [t.cert.risk, `31 / 100 · ${t.cert.levels.moderate}`],
              [t.cert.checkRows.output[0], t.cert.checkRows.output[1]],
            ] as const
          ).map(([k, v], i) => (
            <div key={k} className="flex justify-between gap-4 border-b border-dashed border-line py-2.5 last:border-b-0">
              <dt className="text-muted">{k}</dt>
              <dd className={`text-right ${i === 3 ? "font-medium text-ok" : "text-fg"}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/** Small drawings for the three steps, built from the same UI pieces the product uses. */
function StepPicture({ step, t }: { step: number; t: Messages }) {
  const frame = "grid h-36 place-items-center rounded-2xl border border-line bg-panel/60";
  if (step === 0) {
    return (
      <div className={frame}>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-8 py-4 text-muted">
          <Icon name="upload" className="size-6" />
          <span className="font-mono text-xs">contract.pdf</span>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className={frame}>
        <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-panel-2 py-2 pr-2 pl-3">
          <span className="font-mono text-xs text-muted">…/proof/7Hk2xQ</span>
          <span className="grid size-7 place-items-center rounded-md bg-fg text-bg">
            <Icon name="copy" className="size-3.5" />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className={frame}>
      <SealStamp state="ok" word={t.mk.seal.genuine} ring={t.mk.seal.ring} size={88} />
    </div>
  );
}

