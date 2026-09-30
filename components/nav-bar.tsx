"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher, useI18n } from "./i18n";
import { Logo } from "./logo";

export function NavBar() {
  const { t } = useI18n();
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={path.startsWith(href) ? "page" : undefined}
      className={`hidden rounded-md px-3 py-1.5 transition-colors hover:text-fg sm:inline-flex ${path.startsWith(href) ? "text-fg" : "text-muted"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          ProofAPI
        </Link>
        <div className="flex items-center gap-1.5 text-sm">
          {link("/verify", t.nav.check)}
          {link("/history", t.nav.journal)}
          <LanguageSwitcher />
          <Link
            href="/new"
            className="ml-1 inline-flex h-8 items-center whitespace-nowrap rounded-lg bg-fg px-3 text-sm font-medium text-bg transition-colors hover:bg-white"
          >
            {t.nav.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}
