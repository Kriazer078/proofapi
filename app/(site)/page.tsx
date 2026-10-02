import { Fragment } from "react";
import type React from "react";
import { Check } from "lucide-react";
import { DEV } from "@/lib/i18n/developer";
import { Icon, LinkButton } from "@/components/primitives";
import { CONTACT_URL } from "@/lib/i18n/marketing";
import { getMessages } from "@/lib/i18n/server";
import { UX } from "@/lib/i18n/ux";
import { HERO } from "@/lib/i18n/hero";
import { HeroShot } from "@/components/site/hero-shot";
import { LiveChain } from "@/components/site/live-chain";
import { TamperPreview } from "@/components/site/tamper-preview";

export default async function HomePage() {
  const { t, locale } = await getMessages();
  const u = UX[locale];
  const lp = t.lp;
  const d = DEV[locale];
  const h = HERO[locale];
  return (
    <>
      <section className="landing-hero pt-16 text-center sm:pt-24">
        <h1 className="landing-title mx-auto">
          {h.title.map((line, l) => (
            <span key={line} className="block">
              {line.split(" ").map((word, w) => (
                <Fragment key={w}>
                  {w > 0 && " "}
                  <span
                    className="hero-word"
                    style={{ "--i": l * 3 + w } as React.CSSProperties}
                  >
                    {word}
                  </span>
                </Fragment>
              ))}
            </span>
          ))}
        </h1>
        <p className="hero-sub mx-auto mt-6 max-w-[600px] text-[17px] leading-[1.6] text-text-secondary sm:text-[19px]">
          {h.sub}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <span className="hero-cta" style={{ "--i": 0 } as React.CSSProperties}>
            <LinkButton
              href="/console/keys"
              variant="primary"
              className="h-11 rounded-full px-5 text-[15px]"
            >
              {h.start}
              <Icon name="arrow" />
            </LinkButton>
          </span>
          <span className="hero-cta" style={{ "--i": 1 } as React.CSSProperties}>
            <LinkButton
              href={CONTACT_URL}
              external
              className="h-11 rounded-full px-5 text-[15px]"
            >
              {h.demo}
            </LinkButton>
          </span>
        </div>
        <HeroShot copy={h.shot} />
      </section>
      <section className="grid items-center gap-10 border-t py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 className="section-title">{h.tamper.title}</h2>
          <p className="page-intro">{h.tamper.text}</p>
        </div>
        <TamperPreview copy={h.tamper} shot={h.shot} />
      </section>
      <section className="border-t py-12 sm:py-16">
        <h2 className="section-title">{h.chain.title}</h2>
        <p className="page-intro">{h.chain.text}</p>
        <div className="mt-6">
          <LiveChain example={h.chain.example} />
        </div>
      </section>
      <section id="how" className="border-t py-10 sm:py-16">
        <h2 className="section-title">
          {locale === "ru"
            ? "Первая запись — за три шага"
            : locale === "kk"
              ? "Алғашқы жазба — үш қадамда"
              : "Your first record in three steps"}
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [d.keyStep, d.keyStepText, "/console/keys"],
            [d.install, d.installNote, "/developers#install"],
            [d.requestStep, d.requestStepText, "/playground"],
          ].map(([title, text, href], i) => (
            <li key={title} className="rounded-lg border bg-surface p-6">
              <span className="font-mono text-sm text-text-muted">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-lg font-medium">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {text}
              </p>
              <LinkButton href={href} variant="ghost" className="mt-3 px-0">
                {i === 0 ? d.start : i === 1 ? d.quickstart : d.demo}
                <Icon name="arrow" />
              </LinkButton>
            </li>
          ))}
        </ol>
      </section>
      <section className="border-t py-10 sm:py-16">
        <h2 className="section-title">{d.withAny}</h2>
        <p className="page-intro">{d.providers}</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {d.useCases.map((title, i) => (
            <div key={title}>
              <h3 className="text-base font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {d.useCaseText[i]}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t py-10 sm:py-16">
        <div>
          <h2 className="section-title">
            {locale === "ru"
              ? "Ваши данные остаются у вас."
              : locale === "kk"
                ? "Деректеріңіз өзіңізде қалады."
                : "Your data stays with you."}
          </h2>
          <p className="page-intro">{d.hashText}</p>
          <LinkButton href="/developers" className="mt-4">
            {t.mk.dev.teaserCta}
            <Icon name="arrow" />
          </LinkButton>
        </div>
      </section>
      <section id="pricing" className="border-t py-10 sm:py-16">
        <h2 className="section-title">{lp.pricing.title}</h2>
        <p className="page-intro">{lp.pricing.lead}</p>
        <p className="mt-3 text-[13px] font-medium text-text-secondary">
          {u.futurePlans}
        </p>
        <div className="mt-8 grid overflow-hidden rounded-lg border bg-surface md:grid-cols-3">
          {lp.pricing.plans.map((plan, i) => (
            <div
              key={plan.name}
              className="flex min-w-0 flex-col border-b p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:p-8"
            >
              <h3 className="text-sm font-semibold">{plan.name}</h3>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {plan.price}
                {plan.price.startsWith("$") && (
                  <span className="ml-1 text-sm font-normal text-text-secondary">
                    {lp.pricing.month}
                  </span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-text-secondary">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-text-muted"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <LinkButton
                href={i === 2 ? CONTACT_URL : "/console/keys"}
                external={i === 2}
                className="mt-8 w-full"
              >
                {i === 2 ? u.contact : d.start}
              </LinkButton>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t py-10 sm:py-16">
        <h2 className="section-title">{t.home.faqTitle}</h2>
        <div className="mt-4 divide-y">
          {t.home.faq.map((f) => (
            <details key={f.q} className="py-4">
              <summary className="text-[15px] font-medium">{f.q}</summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
      <section className="flex flex-col items-start gap-4 border-t py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">{t.mk.contact.title}</h2>
          <p className="page-intro">{t.mk.contact.text}</p>
        </div>
        <LinkButton href={CONTACT_URL} external>
          {u.contact}
          <Icon name="external" />
        </LinkButton>
      </section>
    </>
  );
}
