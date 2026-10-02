"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** One surface system across marketing, documentation and working screens. */
export function SiteShell({ children }: { children: ReactNode }) {
  const landing = usePathname() === "/";
  return (
    <div
      data-site-shell
      className={`flex min-h-screen flex-col bg-background text-foreground ${landing ? "landing-theme" : ""}`}
    >
      {children}
    </div>
  );
}
