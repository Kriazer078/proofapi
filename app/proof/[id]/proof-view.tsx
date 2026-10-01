"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n";
import { RiskGauge, riskLevel } from "@/components/risk-gauge";
import { Button, Hash, Icon, LinkButton, Panel } from "@/components/ui";
import { VerdictMark, type VerdictState } from "@/components/verdict-mark";
import { ISSUE_NAMES, formatDate } from "@/lib/i18n/messages";
import type { PublicProof } from "@/lib/public-proof";
import type { VerificationResult } from "@/lib/verifier";

class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function call<T>(url: string, method = "GET"): Promise<T> {
  const res = await fetch(url, { method });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error ?? "Request failed", json.code);
  return json as T;
}

/** `demo` shows the tampering controls used in presentations; people opening a shared link never see them. */
export function ProofView({ initial, liveChain, issuerName, demo }: { initial: PublicProof; liveChain: boolean; issuerName: string; demo: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [proof, setProof] = useState(initial);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Dates use the viewer's time zone, so they are rendered only in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const verify = useCallback(async () => {
    setResult(null);
    try {
      setResult((await call<{ result: VerificationResult }>(`/api/proofs/${proof.id}/verify`)).result);
    } catch {
      setError(t.errors.generic);
    }
  }, [proof.id, t]);

  useEffect(() => {
    verify();
  }, [verify]);

  async function act(name: "retry" | "tamper" | "restore" | "delete") {
    setBusy(name);
    setError(null);
    try {
      if (name === "delete") {
        await call(`/api/proofs/${proof.id}/delete`, "POST");
        router.push("/history");
        return;
      }
      setProof((await call<{ proof: PublicProof }>(`/api/proofs/${proof.id}/${name}`, "POST")).proof);
      await verify();
    } catch (e) {
      setError(e instanceof ApiError && e.code && t.errors.codes[e.code] ? t.errors.codes[e.code] : t.errors.generic);
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/proof/${proof.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t.cert.copyFail);
    }
  }

  const sealedAt = proof.chainTimestamp ?? Math.floor(new Date(proof.createdAt).getTime() / 1000);
  const sealedText = mounted ? formatDate(sealedAt, locale) : "…";
  const c = result?.checks;
  const changedParts = c ? (["input", "output", "metadata"] as const).filter((k) => !c[k].ok).map((k) => t.cert.parts[k]) : [];

  const state: VerdictState = !result ? "checking" : result.status === "VERIFIED" ? "ok" : result.status === "NOT_ON_CHAIN" ? "pending" : "bad";
  const view = {
    checking: { title: t.cert.checking, text: t.cert.checkingText, color: "text-fg", box: "border-line" },
    ok: { title: t.cert.genuine, text: t.cert.genuineText(sealedText), color: "text-ok", box: "border-ok/25 bg-ok/[0.05]" },
    bad: {
      title: t.cert.changed,
      text: changedParts.length ? t.cert.changedText(changedParts.join(", ")) : t.cert.damagedText,
      color: "text-bad",
      box: "border-bad/30 bg-bad/[0.06]",
    },
    pending: { title: t.cert.pending, text: t.cert.pendingText, color: "text-warn", box: "border-warn/30 bg-warn/[0.05]" },
  }[state];

  const checks = c
    ? [
        { label: t.cert.checks.input, ok: c.input.ok },
        { label: t.cert.checks.output, ok: c.output.ok },
        { label: t.cert.checks.seal, ok: c.metadata.ok && c.record.ok && c.issuer.ok },
        { label: t.cert.checks.journal, ok: c.chain.ok },
      ]
    : null;

  return (
    <div className="pt-10">
      <Link href="/history" className="text-sm text-muted transition-colors hover:text-fg">
        ← {t.cert.back}
      </Link>

      {/* Status */}
      <section className={`mt-6 flex flex-col gap-6 rounded-3xl border p-6 sm:p-8 md:flex-row md:items-center md:justify-between ${view.box}`}>
        <div className="flex items-center gap-5">
          <VerdictMark state={state} />
          <div>
            <h1 className={`text-4xl font-semibold tracking-[-0.03em] ${view.color}`} role="status">
              {view.title}
            </h1>
            <p className="mt-1.5 max-w-xl text-lg text-muted text-pretty">{view.text}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {proof.status === "PENDING_CHAIN" ? (
            <Button variant="primary" className="h-11 px-5" onClick={() => act("retry")} disabled={busy !== null}>
              <Icon name="refresh" />
              {busy === "retry" ? t.cert.retrying : t.cert.retry}
            </Button>
          ) : (
            <Button variant="primary" className="h-11 px-5" onClick={copyLink}>
              <Icon name={copied ? "check" : "link"} />
              {copied ? t.cert.copied : t.cert.share}
            </Button>
          )}
          <Button variant="ghost" className="h-11" onClick={verify} disabled={!result}>
            <Icon name="refresh" />
            {t.cert.recheck}
          </Button>
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* The certificate */}
        <Panel className="p-6 sm:p-7">
          <h2 className="text-sm font-medium text-muted">{t.cert.certificate}</h2>
          <dl className="mt-5 grid gap-3 text-[15px]">
            <Row k={t.cert.document} v={proof.inputFileName ?? t.cert.hashOnly} />
            {proof.output && <Row k={t.cert.task} v={t.cert.taskValue} />}
            <Row k={t.cert.issuedBy} v={issuerName} />
            <Row k={t.cert.sealedOn} v={sealedText} />
          </dl>

          {proof.output && (
            <div className="mt-7 border-t border-line pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted">{t.cert.result}</h3>
                {proof.isTampered && <span className="rounded-full border border-bad/30 bg-bad/10 px-2.5 py-0.5 text-xs text-bad">{t.cert.editedBadge}</span>}
              </div>
              <div className="mt-5">
                <RiskGauge value={proof.output.riskScore} riskLabel={t.cert.risk} levelLabel={t.cert.levels[riskLevel(proof.output.riskScore)]} />
              </div>
              <p className="mt-5 text-sm text-muted">{proof.output.issues.length ? t.cert.risksFound(proof.output.issues.length) : t.cert.noRisks}</p>
              <ul className="mt-3 grid gap-2">
                {proof.output.issues.map((issue) => (
                  <li key={issue} className="flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-warn" />
                    {ISSUE_NAMES[locale][issue] ?? issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        {/* What we checked */}
        <Panel className="p-6 sm:p-7">
          <h2 className="text-sm font-medium text-muted">{t.cert.checksTitle}</h2>
          <ul className="mt-4 grid gap-1">
            {(checks ?? Object.values(t.cert.checks).map((label) => ({ label, ok: undefined as boolean | undefined }))).map((row) => (
              <li key={row.label} className="flex items-center gap-3 py-2.5">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    row.ok === undefined ? "border border-line-strong" : row.ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"
                  }`}
                >
                  {row.ok === undefined ? <span className="size-1.5 rounded-full bg-faint animate-pulse-dot" /> : <Icon name={row.ok ? "check" : "x"} />}
                </span>
                <span className={row.ok === false ? "text-bad" : ""}>{row.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-sm text-faint">{t.cert.note}</p>
        </Panel>
      </div>

      {/* Demo attacks, for presentations */}
      {demo && proof.mode === "full" && proof.status === "ANCHORED" && (
        <section className="mt-6 rounded-2xl border border-dashed border-line-strong p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="font-medium">{t.cert.demoTitle}</h2>
              <p className="mt-1 max-w-lg text-sm text-muted">{t.cert.demoText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {proof.isTampered ? (
                <Button onClick={() => act("restore")} disabled={busy !== null}>
                  <Icon name="refresh" />
                  {busy === "restore" ? t.cert.working : t.cert.restore}
                </Button>
              ) : (
                <Button onClick={() => act("tamper")} disabled={busy !== null}>
                  <Icon name="edit" />
                  {busy === "tamper" ? t.cert.working : t.cert.edit}
                </Button>
              )}
              <Button variant="danger" onClick={() => act("delete")} disabled={busy !== null}>
                <Icon name="trash" />
                {t.cert.delete}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* For specialists */}
      <details className="mt-6 rounded-2xl border border-line px-6 py-5 open:bg-panel/60">
        <summary className="cursor-pointer text-muted hover:text-fg">{t.cert.expert}</summary>
        <dl className="mt-5 grid gap-3 text-sm">
          <Row k={t.cert.recordNo} v={proof.sequence !== null ? `#${proof.sequence}` : "—"} />
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t.cert.tx}</dt>
            <dd>
              {proof.explorerUrl ? (
                <a href={proof.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-4 hover:decoration-fg">
                  Solana Explorer <Icon name="external" className="size-3.5" />
                </a>
              ) : liveChain ? (
                "—"
              ) : (
                <span className="text-warn">{t.cert.simulation}</span>
              )}
            </dd>
          </div>
          {proof.model && <Row k={t.cert.model} v={proof.model} mono />}
        </dl>
        {result && result.status !== "NOT_ON_CHAIN" && (
          <div className="mt-5 grid gap-3 border-t border-line pt-5">
            <div className="text-sm text-muted">{t.cert.codes}</div>
            {(["input", "output", "metadata"] as const).map((k) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[120px_1fr]">
                <span className="text-sm text-faint">{t.cert.parts[k]}</span>
                <div className="grid gap-0.5">
                  <Hash value={`${t.cert.recorded}: ${result.checks[k].stored}`} />
                  <Hash value={`${t.cert.now}: ${result.checks[k].current}`} className={result.checks[k].ok ? "" : "!text-bad"} />
                </div>
              </div>
            ))}
          </div>
        )}
        {proof.mode === "full" && proof.status === "ANCHORED" && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
            <LinkButton href={`/api/proofs/${proof.id}/evidence`} external>
              <Icon name="download" />
              {t.cert.evidence}
            </LinkButton>
            {liveChain && (
              <LinkButton href="/verifier.html" external variant="ghost">
                <Icon name="shield" />
                {t.cert.verifier}
              </LinkButton>
            )}
          </div>
        )}
      </details>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className={`min-w-0 truncate text-right ${mono ? "font-mono text-sm" : ""}`}>{v}</dd>
    </div>
  );
}
