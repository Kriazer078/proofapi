import Link from "next/link";
import { Logo } from "@/components/logo";
import { getAIProviderName, getChainMode } from "@/lib/config";
import { CONTACT_URL, GITHUB_URL } from "@/lib/i18n/marketing";
import { getMessages } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getMessages();
  const f = t.lp.footer;
  const programId = process.env.PROGRAM_ID;
  const live = getChainMode() === "anchor" && programId;
  const links = [
    { href: "/developers", label: f.api },
    { href: "/#pricing", label: f.pricing },
    { href: CONTACT_URL, label: f.contact, external: true },
    { href: GITHUB_URL, label: f.github, external: true },
    { href: "/privacy", label: f.privacy },
    { href: "/terms", label: f.terms },
  ];
  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-6 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5 text-foreground">
          <Logo className="size-5" />
          <span className="font-medium">ProofAPI</span>
          <span className="text-faint">
            · {f.rights.replace("© 2026 ProofAPI · ", "")}
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-6 gap-y-1 px-4 pb-6 text-[13px] text-faint sm:px-6">
        {live ? (
          <a
            href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            {t.footer.chain}
          </a>
        ) : (
          <span>{t.cert.simulation}</span>
        )}
        <span>
          {getAIProviderName() === "gemini" ? t.footer.gemini : t.footer.demo}
        </span>
      </div>
    </footer>
  );
}
