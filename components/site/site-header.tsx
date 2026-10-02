"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { LanguageSwitcher, useI18n } from "@/components/i18n";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { DEV } from "@/lib/i18n/developer";
import { HERO } from "@/lib/i18n/hero";
import { UX } from "@/lib/i18n/ux";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t, locale } = useI18n();
  const u = UX[locale];
  const d = DEV[locale];
  const h = HERO[locale];
  const path = usePathname();
  const publicProof = path.startsWith("/proof/");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  function dismissMenu() {
    setMenuOpen(false);
    menuButton.current?.focus();
  }
  const links = [
    { href: "/developers", label: d.docs },
    { href: "/playground", label: d.playground },
    { href: "/#pricing", label: t.mk.nav.pricing },
    { href: "/console", label: d.console },
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <a href="#main-content" className="skip-link">
        {u.skip}
      </a>
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 text-base font-semibold"
        >
          <Logo className="size-5" />
          ProofAPI
        </Link>
        <nav
          aria-label={u.navigation}
          className="hidden flex-1 items-center gap-1 lg:flex"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path === l.href ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-muted hover:text-foreground",
                path === l.href
                  ? "bg-surface-muted font-medium text-foreground"
                  : "text-text-secondary",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          {!publicProof && (
            <>
              <Link
                href="/signin"
                className="hidden px-2 text-sm text-text-secondary transition-colors hover:text-foreground lg:inline"
              >
                {h.signIn}
              </Link>
              <Link
                href="/console/keys"
                data-slot="button"
                aria-current={path === "/console/keys" ? "page" : undefined}
                className={cn(
                  buttonVariants(),
                  "hidden rounded-full px-4 lg:inline-flex",
                )}
              >
                {h.start}
              </Link>
            </>
          )}
          <Button
            ref={menuButton}
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
            onKeyDown={(event) => {
              if (event.key === "Escape") dismissMenu();
            }}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label={u.navigation}
          className="border-t bg-surface px-4 py-3 lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") dismissMenu();
          }}
        >
          <div className="mx-auto grid max-w-[1132px] gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={path === link.href ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-between rounded-md px-3 text-sm hover:bg-surface-muted",
                  path === link.href
                    ? "bg-surface-muted font-medium text-foreground"
                    : "text-text-secondary",
                )}
              >
                {link.label}
                <ArrowUpRight
                  className="size-4 text-text-muted"
                  aria-hidden="true"
                />
              </Link>
            ))}
            {!publicProof && (
              <Link
                href="/console/keys"
                onClick={() => setMenuOpen(false)}
                className={cn(buttonVariants(), "mt-2 min-h-11 w-full rounded-full")}
              >
                {h.start}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
