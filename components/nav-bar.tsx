import Link from "next/link";
import type { ChainMode } from "@/lib/config";
import { Logo } from "./logo";

export function NavBar({ mode, programId }: { mode: ChainMode; programId: string | null }) {
  const live = mode === "anchor" && programId;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          ProofAPI
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/history" className="rounded-md px-2 py-1.5 text-muted transition-colors hover:text-fg sm:px-3">
            History
          </Link>
          <Link href="/verify" className="rounded-md px-2 py-1.5 text-muted transition-colors hover:text-fg sm:px-3">
            Verify
          </Link>
          {live ? (
            <a
              href={`https://explorer.solana.com/address/${programId}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="ml-2 hidden items-center gap-2 rounded-full border border-line-strong px-3 py-1 text-xs text-muted transition-colors hover:text-fg sm:inline-flex"
            >
              <span className="size-1.5 rounded-full bg-sol-green animate-pulse-dot" />
              Solana devnet
            </a>
          ) : (
            <span className="ml-2 hidden rounded-full border border-warn/30 px-3 py-1 text-xs text-warn sm:inline-flex">Local simulation</span>
          )}
          <Link href="/new" className="ml-1 inline-flex h-8 items-center whitespace-nowrap rounded-lg bg-fg px-3 text-sm font-medium text-bg transition-colors hover:bg-white sm:ml-2">
            New proof
          </Link>
        </div>
      </nav>
    </header>
  );
}
