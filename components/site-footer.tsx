import Link from "next/link";
import { getChainMode } from "@/lib/config";
import { getMessages } from "@/lib/i18n/server";
import { Logo } from "./logo";

export async function SiteFooter() {
  const { t } = await getMessages();
  const live = getChainMode() === "anchor" && process.env.PROGRAM_ID;
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <Logo className="size-5" />
          <span className="text-muted">ProofAPI</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {live ? (
            <a href={`https://explorer.solana.com/address/${process.env.PROGRAM_ID}?cluster=devnet`} target="_blank" rel="noreferrer" className="hover:text-muted">
              {t.footer.chain}
            </a>
          ) : (
            <span className="text-warn">{t.cert.simulation}</span>
          )}
          <span>{t.footer.demo}</span>
          <Link href="/verify" className="hover:text-muted">
            {t.check.expertTitle}
          </Link>
        </div>
      </div>
    </footer>
  );
}
