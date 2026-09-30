import { TamperDemo } from "@/components/tamper-demo";
import { Icon, LinkButton } from "@/components/ui";
import { getMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/messages";

export default async function HomePage() {
  const { t } = await getMessages();
  return (
    <>
      {/* 1. What it is + the two things you can do */}
      <section className="grid items-center gap-14 pt-16 pb-24 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
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
          <CertificatePreview t={t} />
        </div>
      </section>

      {/* 2. How it works */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.howTitle}</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {t.home.steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-panel/60 p-6">
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

      {/* 3. Try it */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.demoTitle}</h2>
        <p className="mt-3 max-w-xl text-muted">{t.home.demoText}</p>
        <div className="mt-10">
          <TamperDemo />
        </div>
      </section>

      {/* 4. Who it's for */}
      <section className="border-t border-line py-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">{t.home.whoTitle}</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {t.home.who.map((w) => (
            <div key={w.title}>
              <h3 className="text-lg font-medium">{w.title}</h3>
              <p className="mt-2 text-muted">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Questions */}
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

      {/* 6. Final call */}
      <section className="ring-sol mt-4 flex flex-col items-center rounded-3xl bg-panel/70 px-6 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-balance">{t.home.finalTitle}</h2>
        <LinkButton href="/new" variant="primary" className="mt-8 h-12 px-6 text-base">
          {t.home.ctaPrimary}
          <Icon name="arrow" />
        </LinkButton>
      </section>
    </>
  );
}

/** What the client sees when they open a certificate link. */
function CertificatePreview({ t }: { t: Messages }) {
  return (
    <div className="ring-sol relative rounded-3xl bg-panel/90 p-7 shadow-2xl shadow-black/40">
      <span className="absolute top-5 right-5 rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-faint">{t.home.example}</span>
      <div className="flex items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-full bg-ok text-bg">
          <span className="absolute inset-0 rounded-full bg-ok opacity-40 blur-lg" />
          <Icon name="check" className="relative size-7" />
        </span>
        <div>
          <div className="text-2xl font-semibold text-ok">{t.cert.genuine}</div>
          <div className="text-sm text-muted">{t.cert.certificate}</div>
        </div>
      </div>
      <dl className="mt-7 grid gap-3 border-t border-line pt-6 text-[15px]">
        <Row k={t.cert.document} v="NDA_Acme_v3.pdf" />
        <Row k={t.cert.task} v={t.cert.taskValue} />
        <Row k={t.cert.risk} v={`31 / 100 · ${t.cert.levels.moderate}`} />
        <Row k={t.cert.issuedBy} v="Acme Legal" />
      </dl>
      <div className="mt-7 flex h-11 items-center justify-center gap-2 rounded-lg bg-fg text-sm font-medium text-bg">
        <Icon name="link" />
        {t.cert.share}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right text-fg">{v}</dd>
    </div>
  );
}

/** Small drawings for the three steps, built from the same UI pieces the product uses. */
function StepPicture({ step, t }: { step: number; t: Messages }) {
  const frame = "grid h-32 place-items-center rounded-xl border border-line bg-bg/70";
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
      <div className="flex items-center gap-2.5 rounded-full border border-ok/30 bg-ok/10 px-4 py-2 text-ok">
        <Icon name="check" className="size-4" />
        <span className="font-medium">{t.cert.genuine}</span>
      </div>
    </div>
  );
}
