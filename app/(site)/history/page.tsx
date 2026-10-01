import Link from "next/link";
import { type AuditStatus, auditHistory } from "@/lib/history-audit";
import { formatDate } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { currentUser } from "@/lib/auth";
import { currentOwnerHash } from "@/lib/request-access";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

export const dynamic = "force-dynamic";

const TONE: Record<AuditStatus, "ok" | "bad" | "neutral"> = {
  OK: "ok",
  HASH_ONLY: "neutral",
  MISSING_IN_DATABASE: "bad",
  DATA_MODIFIED: "bad",
  CHAIN_BROKEN: "bad",
};
const PILL = { ok: "text-ok bg-ok/10 border-ok/25", bad: "text-bad bg-bad/10 border-bad/25", neutral: "text-muted bg-white/[0.04] border-line-strong" };

export default async function JournalPage() {
  const { t, locale } = await getMessages();
  const { deps, access } = getServices();
  const audit = await auditHistory(deps);
  // Anyone sees that records exist and whether they are intact; names and links only for your own certificates.
  const owner = await currentOwnerHash();
  const user = await currentUser();
  const mine = new Set([
    ...(owner ? await access.ownedIds(owner) : []),
    ...(user ? (await access.userUploads(user.id, new Date(0), 500)).map((u) => u.proofId) : []),
  ]);
  const entries = [...audit.entries].reverse();

  return (
    <div className="pt-16">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.03em]">{t.journal.title}</h1>
          <p className="mt-3 max-w-lg text-lg text-muted">{t.journal.lead}</p>
        </div>
        <div className="flex gap-10">
          <Stat label={t.journal.total} value={audit.total} />
          <Stat label={t.journal.ok} value={audit.ok} tone="text-ok" />
          <Stat label={t.journal.problems} value={audit.problems} tone={audit.problems ? "text-bad" : undefined} />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-14 rounded-2xl border border-dashed border-line-strong p-12 text-center">
          <p className="text-muted">{t.journal.empty}</p>
          <Link href="/new" className="mt-5 inline-flex h-11 items-center rounded-lg bg-fg px-5 font-medium text-bg">
            {t.journal.createFirst}
          </Link>
        </div>
      ) : (
        <ol className="mt-12 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel/60">
          {entries.map((e) => {
            const tone = TONE[e.status];
            const s = t.journal.status[e.status];
            const own = e.dbId !== null && mine.has(e.dbId);
            const title = !own && e.dbId ? t.journal.hidden : (e.fileName ?? (e.status === "HASH_ONLY" ? t.cert.hashOnly : t.journal.unknown));
            const body = (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="truncate font-medium">{title}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${PILL[tone]}`}>{s.label}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {e.timestamp ? formatDate(e.timestamp, locale) : "—"}
                    {s.note && <span className={tone === "bad" ? "text-bad/90" : ""}> · {s.note}</span>}
                  </div>
                </div>
                {own && <span className="hidden text-sm text-muted sm:inline">{t.journal.open} →</span>}
              </>
            );
            return (
              <li key={e.sequence}>
                {own ? (
                  <Link href={`/proof/${e.dbId}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {audit.pendingInDatabase > 0 && <p className="mt-6 text-sm text-warn">{t.journal.pending(audit.pendingInDatabase)}</p>}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className={`text-3xl font-semibold tabular-nums tracking-tight ${tone ?? ""}`}>{value}</div>
      <div className="text-sm text-faint">{label}</div>
    </div>
  );
}
