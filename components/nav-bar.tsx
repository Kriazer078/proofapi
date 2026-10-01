"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher, useI18n } from "./i18n";
import { Logo } from "./logo";

export function NavBar() {
  const { t } = useI18n();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);

  const links = [
    { href: "/verify", label: t.nav.check },
    { href: "/developers", label: t.mk.nav.developers },
    { href: "/#pricing", label: t.mk.nav.pricing },
    { href: "/history", label: t.nav.journal },
  ];
  const active = (href: string) => !href.includes("#") && path.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          ProofAPI
        </Link>
        <div className="flex items-center gap-1.5 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`hidden rounded-md px-3 py-1.5 transition-colors hover:text-fg lg:inline-flex ${active(l.href) ? "text-fg" : "text-muted"}`}
            >
              {l.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <Link href="/new" className="ml-1 hidden h-8 items-center whitespace-nowrap rounded-lg bg-fg px-3 text-sm font-medium text-bg transition-colors hover:bg-white lg:inline-flex">
            {t.nav.cta}
          </Link>
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={t.nav.menu}
            className="grid size-8 place-items-center rounded-lg border border-line-strong text-muted lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>
      {menu && (
        <div id="mobile-menu" className="border-t border-line px-5 pt-2 pb-5 lg:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`block py-3 text-lg ${active(l.href) ? "text-fg" : "text-muted"}`}>
              {l.label}
            </Link>
          ))}
          <Link href="/new" className="mt-3 flex h-12 items-center justify-center rounded-lg bg-fg font-medium text-bg">
            {t.nav.cta}
          </Link>
        </div>
      )}
    </header>
  );
}
