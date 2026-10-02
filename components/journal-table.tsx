"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Button, Icon, LinkButton, Pill } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/i18n/messages";
import { UX } from "@/lib/i18n/ux";
import type { AuditStatus } from "@/lib/history-audit";
export type JournalRow = {
  sequence: number;
  status: AuditStatus;
  title: string;
  timestamp: number | null;
  href: string | null;
};
const tone = {
  OK: "ok",
  HASH_ONLY: "neutral",
  MISSING_IN_DATABASE: "bad",
  DATA_MODIFIED: "bad",
  CHAIN_BROKEN: "bad",
} as const;
const PAGE_SIZE = 25;
export function JournalTable({ entries }: { entries: JournalRow[] }) {
  const { t, locale } = useI18n();
  const u = UX[locale];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (status === "all" || e.status === status) &&
          `${e.title} #${e.sequence} ${t.journal.status[e.status].label}`
            .toLocaleLowerCase(locale)
            .includes(query.trim().toLocaleLowerCase(locale)),
      ),
    [entries, query, status, t, locale],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(
    current * PAGE_SIZE,
    (current + 1) * PAGE_SIZE,
  );
  function reset() {
    setQuery("");
    setStatus("all");
    setPage(0);
  }
  if (!entries.length)
    return (
      <section className="surface mt-6 p-6 sm:p-8">
        <h2 className="section-title">{t.journal.empty}</h2>
        <p className="mt-2 text-sm text-text-secondary">{u.privateNote}</p>
        <LinkButton href="/new" variant="primary" className="mt-5">
          {t.journal.createFirst}
          <Icon name="arrow" />
        </LinkButton>
      </section>
    );
  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 sm:w-80">
          <Search
            className="pointer-events-none absolute top-3 left-3 size-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            aria-label={u.search}
            placeholder={u.search}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(String(value));
            setPage(0);
          }}
        >
          <SelectTrigger
            aria-label={u.status}
            className="h-10 w-full border-border-strong bg-surface sm:w-52"
          >
            <SelectValue>
              {status === "all"
                ? u.all
                : t.journal.status[status as AuditStatus].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="all">{u.all}</SelectItem>
            {(Object.keys(t.journal.status) as AuditStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {t.journal.status[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(query || status !== "all") && (
          <Button variant="ghost" onClick={reset}>
            {u.clear}
          </Button>
        )}
      </div>
      <div className="surface overflow-hidden">
        <Table className="table-fixed">
          <caption className="sr-only">
            {t.journal.title}. {u.privateNote}
          </caption>
          <TableHeader>
            <TableRow className="bg-surface-muted/60 hover:bg-surface-muted/60">
              <TableHead className="w-20 sm:w-24">{u.record}</TableHead>
              <TableHead>{u.object}</TableHead>
              <TableHead className="hidden w-48 sm:table-cell">
                {u.status}
              </TableHead>
              <TableHead className="hidden w-52 md:table-cell">
                {u.date}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((e) => (
              <TableRow key={e.sequence}>
                <TableCell className="align-top font-mono text-[13px] text-text-secondary">
                  #{e.sequence}
                </TableCell>
                <TableCell className="max-w-[420px] whitespace-normal">
                  <div className="break-words [overflow-wrap:anywhere]">
                    {e.href ? (
                      <Link
                        href={e.href}
                        className="font-medium underline decoration-transparent hover:decoration-border-strong"
                      >
                        {e.title}
                      </Link>
                    ) : (
                      <span className="text-text-secondary">{e.title}</span>
                    )}
                  </div>
                  <div className="mt-2 sm:hidden">
                    <Pill tone={tone[e.status]}>
                      {t.journal.status[e.status].label}
                    </Pill>
                  </div>
                  {t.journal.status[e.status].note && (
                    <p className="mt-1 text-[13px] leading-5 text-text-secondary">
                      {t.journal.status[e.status].note}
                    </p>
                  )}
                  <p className="mt-1 text-[13px] text-text-muted md:hidden">
                    {e.timestamp ? formatDate(e.timestamp, locale) : "—"}
                  </p>
                </TableCell>
                <TableCell className="hidden align-top sm:table-cell">
                  <Pill tone={tone[e.status]}>
                    {t.journal.status[e.status].label}
                  </Pill>
                </TableCell>
                <TableCell className="hidden align-top text-[13px] text-text-secondary md:table-cell">
                  {e.timestamp ? formatDate(e.timestamp, locale) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  <p className="font-medium">{u.noMatches}</p>
                  <Button variant="ghost" onClick={reset} className="mt-2">
                    {u.clear}
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[13px] text-text-secondary">
          <span role="status">
            {u.resultCount(filtered.length)} · {u.page} {current + 1} / {pages}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              size="sm"
            >
              {u.previous}
            </Button>
            <Button
              onClick={() => setPage(current + 1)}
              disabled={current + 1 >= pages}
              size="sm"
            >
              {u.next}
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-text-muted">{u.privateNote}</p>
    </div>
  );
}
