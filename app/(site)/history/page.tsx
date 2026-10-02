import { auditHistory } from "@/lib/history-audit";
import { getMessages } from "@/lib/i18n/server";
import { currentUser } from "@/lib/auth";
import { currentOwnerHash } from "@/lib/request-access";
import { getServices } from "@/lib/services";
import { JournalTable, type JournalRow } from "@/components/journal-table";
import { LinkButton } from "@/components/primitives";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export default async function JournalPage() {
  const { t } = await getMessages();
  const { deps, access } = getServices();
  const audit = await auditHistory(deps);
  const owner = await currentOwnerHash();
  const user = await currentUser();
  const mine = new Set([
    ...(owner ? await access.ownedIds(owner) : []),
    ...(user
      ? (await access.userUploads(user.id, new Date(0), 500)).map(
          (u) => u.proofId,
        )
      : []),
  ]);
  // Privacy is resolved on the server: private names and identifiers never enter client props.
  const entries: JournalRow[] = [...audit.entries].reverse().map((e) => {
    const own = e.dbId !== null && mine.has(e.dbId);
    return {
      sequence: e.sequence,
      status: e.status,
      timestamp: e.timestamp,
      title:
        !own && e.dbId
          ? t.journal.hidden
          : (e.fileName ??
            (e.status === "HASH_ONLY" ? t.cert.hashOnly : t.journal.unknown)),
      href: own ? `/proof/${e.dbId}` : null,
    };
  });
  return (
    <div className="page-space">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t.journal.title}</h1>
          <p className="page-intro">{t.journal.lead}</p>
        </div>
        <LinkButton href="/new" variant="primary">
          {t.nav.cta}
        </LinkButton>
      </div>
      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-y py-4">
        {[
          [t.journal.total, audit.total, ""],
          [t.journal.ok, audit.ok, "text-success"],
          [
            t.journal.problems,
            audit.problems,
            audit.problems ? "text-danger" : "",
          ],
        ].map(([label, value, tone]) => (
          <div key={label}>
            <dt className="text-[13px] text-text-secondary">{label}</dt>
            <dd className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <JournalTable entries={entries} />
      {audit.pendingInDatabase > 0 && (
        <p className="mt-4 text-sm text-warning">
          {t.journal.pending(audit.pendingInDatabase)}
        </p>
      )}
    </div>
  );
}
