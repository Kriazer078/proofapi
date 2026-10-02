"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n";
import { DEV } from "@/lib/i18n/developer";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/primitives";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
type Key = {
  id: string;
  name: string;
  masked: string;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
};
type Overview = {
  usage: { month: number; limit: number; today: number; perDay: number[] };
  activeKeys: number;
  certificates: {
    id: string;
    label: string;
    key: string;
    status: string;
    changed: boolean;
    createdAt: string;
  }[];
};
export function ConsoleScreen({
  section,
}: {
  section: "overview" | "keys" | "records" | "usage";
}) {
  const { locale } = useI18n();
  const d = DEV[locale];
  const [keys, setKeys] = useState<Key[]>([]);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(section === "keys" ? "/api/console/keys" : "/api/console/overview", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok)
          throw new Error(res.status === 401 ? d.signedOut : d.error);
        return res.json();
      })
      .then((value) => {
        if (section === "keys") setKeys(value.keys);
        else setData(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [section, revision, d.error, d.signedOut]);
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(value));
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/console/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const value = await res.json();
        throw new Error(
          res.status === 401
            ? d.signedOut
            : value.code === "too_many_keys"
              ? d.limit
              : d.error,
        );
      }
      const value = await res.json();
      setSecret(value.key);
      setName("");
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    if (!revokeId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/console/keys/${encodeURIComponent(revokeId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(res.status === 401 ? d.signedOut : d.error);
      setRevokeId(null);
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : d.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">{d[section]}</h1>
      <p className="page-intro">
        {section === "keys"
          ? d.keyStepText
          : section === "records"
            ? d.recordLead
            : section === "usage"
              ? d.usageLead
              : d.ready}
      </p>
      {error && (
        <div role="alert" className="mt-5 inline-error">
          {error}
          <Button
            variant="ghost"
            onClick={() => setRevision((r) => r + 1)}
            className="ml-2"
          >
            {d.retry}
          </Button>
          {error === d.signedOut && (
            <Link href="/signin" className="text-link">
              {d.signin}
            </Link>
          )}
        </div>
      )}
      {section === "keys" && (
        <>
          {secret && (
            <section className="mt-6 rounded-lg border border-success/40 bg-success-soft p-5">
              <h2 className="text-base font-semibold">{d.secretTitle}</h2>
              <p className="mt-2 text-sm text-text-secondary">{d.secretNote}</p>
              <div className="mt-4">
                <CodeBlock
                  label="PROOFAPI_API_KEY"
                  code={secret}
                  copyLabel={d.copy}
                  copiedLabel={d.copied}
                />
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSecret("")}
              >
                {d.saved}
              </Button>
            </section>
          )}
          <form
            onSubmit={create}
            className="mt-6 flex flex-wrap items-end gap-3 border-b pb-6"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="key-name" className="data-label">
                {d.keyName}
              </label>
              <Input
                id="key-name"
                placeholder="support-agent"
                className="mt-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                disabled={busy || !!secret}
              />
            </div>
            <Button
              type="submit"
              disabled={busy || !!secret || !name.trim() || loading}
            >
              {busy ? d.loading : d.createKey}
            </Button>
          </form>
          {!loading && keys.length === 0 && (
            <div className="py-10">
              <h2 className="section-title">{d.emptyKeys}</h2>
              <p className="page-intro">{d.emptyKeysText}</p>
            </div>
          )}
          <div className="divide-y">
            {keys.map((key) => (
              <article
                key={key.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-all text-sm font-medium">
                      {key.name}
                    </h2>
                    <span
                      className={`text-xs ${key.revoked ? "text-text-muted" : "text-success"}`}
                    >
                      {key.revoked ? d.revoked : d.active}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-secondary">
                    {key.masked}
                  </p>
                  <p className="mt-2 text-xs text-text-muted">
                    {d.created}: {date(key.createdAt)} · UTC · {d.lastUsed}:{" "}
                    {key.lastUsedAt ? date(key.lastUsedAt) + " · UTC" : d.never}
                  </p>
                </div>
                {!key.revoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setRevokeId(key.id)}
                  >
                    {d.revoke}
                  </Button>
                )}
              </article>
            ))}
          </div>
          <AlertDialog
            open={!!revokeId}
            onOpenChange={(open) => {
              if (!open && !busy) setRevokeId(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{d.revokeTitle}</AlertDialogTitle>
                <AlertDialogDescription>{d.revokeText}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>
                  {d.cancel}
                </AlertDialogCancel>
                <Button variant="destructive" disabled={busy} onClick={revoke}>
                  {busy ? d.loading : d.revoke}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {loading && (
        <p role="status" className="py-10 text-sm text-text-secondary">
          {d.loading}
        </p>
      )}
      {data && !loading && section !== "keys" && (
        <>
          {(section === "overview" || section === "usage") && (
            <>
              <dl className="mt-6 grid gap-5 border-y py-6 sm:grid-cols-3">
                {[
                  [d.month, data.usage.month],
                  [d.today, data.usage.today],
                  [d.activeKeys, data.activeKeys],
                ].map(([title, value]) => (
                  <div key={title}>
                    <dt className="data-label">{title}</dt>
                    <dd className="mt-2 text-2xl font-semibold tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-text-secondary">
                {d.allowance}: {data.usage.month} / {data.usage.limit}
              </p>
              <progress
                className="mt-2 h-2 w-full accent-success"
                max={data.usage.limit || 1}
                value={Math.min(data.usage.month, data.usage.limit)}
                aria-label={d.month}
              />
            </>
          )}
          {section === "overview" && (
            <section className="mt-8">
              <h2 className="section-title">{d.quickstart}</h2>
              <ol className="mt-4 divide-y">
                {[
                  ["/console/keys", d.keyStep, d.keyStepText],
                  ["/developers#install", d.install, d.installNote],
                  ["/console/playground", d.requestStep, d.requestStepText],
                ].map(([href, title, text], i) => (
                  <li key={href} className="flex gap-4 py-4">
                    <span className="font-mono text-sm text-text-muted">
                      0{i + 1}
                    </span>
                    <div>
                      <Link href={href} className="text-link text-sm">
                        {title}
                      </Link>
                      <p className="mt-1 text-sm text-text-secondary">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {section === "usage" && (
            <>
              <p className="mt-4 text-sm text-text-secondary">{d.usageNote}</p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-text-secondary">
                      <th className="py-3">UTC</th>
                      <th className="py-3 text-right">{d.records}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.usage.perDay.map((count, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {section === "records" &&
            (data.certificates.length ? (
              <div className="mt-6 divide-y border-t">
                {data.certificates.map((record) => (
                  <article
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/proof/${record.id}`}
                        className="break-all text-sm font-medium hover:underline"
                      >
                        {record.label}
                      </Link>
                      <p className="mt-1 break-all font-mono text-xs text-text-muted">
                        {record.id}
                      </p>
                      <p className="mt-2 text-xs text-text-secondary">
                        {d.key}: {record.key} · {date(record.createdAt)} · UTC
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs ${record.changed ? "text-danger" : record.status === "ANCHORED" ? "text-success" : "text-warning"}`}
                    >
                      {record.changed ? "CHANGED" : record.status}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-10">
                <h2 className="section-title">{d.emptyRecords}</h2>
                <p className="page-intro">{d.emptyRecordsText}</p>
                <LinkButton href="/console/playground" className="mt-5">
                  {d.demo}
                </LinkButton>
              </div>
            ))}
        </>
      )}
    </>
  );
}
