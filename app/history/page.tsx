import Link from "next/link";
import { Icon, Pill } from "@/components/ui";
import { formatUtc, shortHash } from "@/lib/format";
import { type AuditStatus, auditHistory } from "@/lib/history-audit";
import { getServices } from "@/lib/services";

export const dynamic = "force-dynamic";

const STATUS: Record<AuditStatus, { label: string; tone: "ok" | "bad" | "warn" | "neutral"; note?: string }> = {
  OK: { label: "Intact", tone: "ok" },
  HASH_ONLY: { label: "Hash-only", tone: "neutral", note: "Content stays with its owner." },
  MISSING_IN_DATABASE: { label: "Deleted from database", tone: "bad", note: "Still on Solana. It can't be hidden." },
  DATA_MODIFIED: { label: "Edited in database", tone: "bad", note: "Stored data no longer matches Solana." },
  CHAIN_BROKEN: { label: "Broken link", tone: "bad", note: "Doesn't link to the previous record." },
};

const DOT: Record<string, string> = { ok: "bg-ok", bad: "bg-bad", warn: "bg-warn", neutral: "bg-faint" };

export default async function HistoryPage() {
  const { deps, chain } = getServices();
  const audit = await auditHistory(deps);
  const entries = [...audit.entries].reverse();

  return (
    <div className="pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.03em]">History</h1>
          <p className="mt-3 max-w-lg text-muted">Every record of issuer {audit.issuerName ?? "ProofAPI"} on Solana, checked against our database.</p>
        </div>
        <div className="flex gap-8 text-sm">
          <Stat label="On Solana" value={audit.total} />
          <Stat label="Intact" value={audit.ok} tone="text-ok" />
          <Stat label="Problems" value={audit.problems} tone={audit.problems ? "text-bad" : undefined} />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-14 rounded-2xl border border-dashed border-line-strong p-10 text-center">
          <p className="text-muted">No records yet.</p>
          <Link href="/new" className="mt-4 inline-flex text-sm text-fg underline underline-offset-4">
            Create the first proof
          </Link>
        </div>
      ) : (
        <ol className="relative mt-14">
          <span className="absolute top-3 bottom-3 left-[7px] w-px bg-line-strong" aria-hidden="true" />
          {entries.map((e) => {
            const s = STATUS[e.status];
            const url = e.account ? chain.accountUrl(e.account) : null;
            return (
              <li key={e.sequence} className="relative grid gap-2 pb-8 pl-10 sm:grid-cols-[1fr_auto] sm:items-center">
                <span className={`absolute top-1.5 left-0 size-[15px] rounded-full border-[3px] border-bg ${DOT[s.tone]}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm text-faint">#{e.sequence}</span>
                    <span className="truncate font-medium">{e.fileName ?? (e.status === "MISSING_IN_DATABASE" ? "Unknown document" : "Hash-only record")}</span>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {e.timestamp ? formatUtc(e.timestamp) : "—"}
                    {s.note && <span className={s.tone === "bad" ? "text-bad/90" : ""}> · {s.note}</span>}
                    {e.proofId && <span className="font-mono text-xs text-faint"> · {shortHash(e.proofId, 8, 4)}</span>}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  {e.dbId && (
                    <Link href={`/proof/${e.dbId}`} className="text-muted transition-colors hover:text-fg">
                      Open
                    </Link>
                  )}
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted transition-colors hover:text-fg">
                      Solana <Icon name="external" className="size-3.5" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {audit.pendingInDatabase > 0 && <p className="text-sm text-warn">{audit.pendingInDatabase} proof(s) are saved but not on Solana yet.</p>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className={`text-3xl font-semibold tabular-nums tracking-tight ${tone ?? ""}`}>{value}</div>
      <div className="text-faint">{label}</div>
    </div>
  );
}
