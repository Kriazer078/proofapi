import Link from "next/link";
import { getAIProviderName, getChainMode } from "@/lib/config";
import { CONTACT_URL, GITHUB_URL } from "@/lib/i18n/marketing";
import { getMessages } from "@/lib/i18n/server";
import { Logo } from "./logo";

export async function SiteFooter() {
  const { t } = await getMessages();
  const f = t.mk.footer;
  const programId = process.env.PROGRAM_ID;
  const live = getChainMode() === "anchor" && programId;
  const columns: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: f.product,
      links: [
        { href: "/new", label: t.nav.cta },
        { href: "/verify", label: t.nav.check },
        { href: "/history", label: t.nav.journal },
        { href: "/#pricing", label: t.mk.nav.pricing },
      ],
    },
    {
      title: f.developers,
      links: [
        { href: "/developers", label: f.api },
        { href: "/verifier.html", label: f.verifier, external: true },
        { href: GITHUB_URL, label: f.github, external: true },
      ],
    },
    {
      title: f.company,
      links: [
        { href: CONTACT_URL, label: f.contact, external: true },
        { href: "/privacy", label: f.privacy },
        { href: "/terms", label: f.terms },
      ],
    },
  ];
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5 font-semibold">
            <Logo className="size-5" />
            ProofAPI
          </div>
          <p className="mt-3 max-w-xs text-sm text-faint">{t.home.lead}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-medium">{col.title}</h2>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-fg">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-muted transition-colors hover:text-fg">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-6 gap-y-2 px-5 py-5 text-xs text-faint sm:px-8">
          <span>{f.rights}</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1">
            {live ? (
              <a href={`https://explorer.solana.com/address/${programId}?cluster=devnet`} target="_blank" rel="noreferrer" className="hover:text-muted">
                {t.footer.chain} (devnet)
              </a>
            ) : (
              <span className="text-warn">{t.cert.simulation}</span>
            )}
            <span>{getAIProviderName() === "gemini" ? t.footer.gemini : t.footer.demo}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
