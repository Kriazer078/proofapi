"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher, useI18n } from "@/components/i18n";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { CONTACT_URL } from "@/lib/i18n/marketing";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useI18n();
  const n = t.lp.nav;
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const links = [
    { href: "/#how", label: n.how },
    { href: "/#cases", label: n.cases },
    { href: "/developers", label: n.developers },
    { href: "/#pricing", label: n.pricing },
  ];

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <Logo />
          ProofAPI
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] text-muted-foreground lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <a href={CONTACT_URL} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "md" }), "hidden bg-card md:inline-flex")}>
            {n.demo}
          </a>
          <Link href="/console" className={cn(buttonVariants({ size: "md" }), "hidden sm:inline-flex")}>
            {n.start}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label="Menu"
            className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="site-menu" aria-label="Main" className="border-t border-border bg-background px-5 pt-2 pb-5 lg:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block py-3 text-lg text-foreground">
              {l.label}
            </Link>
          ))}
          <div className="mt-3 grid gap-2">
            <Link href="/console" className={cn(buttonVariants({ size: "xl" }), "w-full")}>
              {n.start}
            </Link>
            <a href={CONTACT_URL} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full bg-card")}>
              {n.demo}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
