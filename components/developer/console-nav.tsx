"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useI18n } from "@/components/i18n";
import { DEV } from "@/lib/i18n/developer";
import { Button } from "@/components/ui/button";
export function ConsoleNav({ name }: { name: string }) {
  const { locale } = useI18n();
  const d = DEV[locale];
  const path = usePathname();
  const links = [
    ["/console", d.overview],
    ["/console/keys", d.keys],
    ["/console/playground", d.playground],
    ["/console/records", d.records],
    ["/console/usage", d.usage],
    ["/developers", d.docs],
  ];
  return (
    <aside className="min-w-0 lg:sticky lg:top-20">
      <p className="mb-3 truncate text-sm font-medium">{name}</p>
      <nav
        aria-label={d.console}
        className="flex flex-wrap gap-1 border-b pb-4 lg:flex-col lg:border-b-0"
      >
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm hover:bg-surface-muted ${path === href ? "bg-surface-muted font-medium" : "text-text-secondary"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Button
        variant="ghost"
        className="mt-3 text-text-muted"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        {d.signout}
      </Button>
    </aside>
  );
}
