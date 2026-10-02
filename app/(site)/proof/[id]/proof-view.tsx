"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { riskLevel } from "@/components/risk-gauge";
import { Button, Hash, Icon, LinkButton } from "@/components/primitives";
import { SealStamp, type SealState } from "@/components/seal-stamp";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ISSUE_NAMES, formatDate } from "@/lib/i18n/messages";
import { UX } from "@/lib/i18n/ux";
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
async function call<T>(
  url: string,
  method = "GET",
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(url, { method, signal });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error ?? "Request failed", json.code);
  return json as T;
}

/** Canonical product screen: a verifiable document, with explicit scope and recovery. */
export function ProofView({
  initial,
  liveChain,
  issuerName,
  demo,
}: {
  initial: PublicProof;
  liveChain: boolean;
  issuerName: string;
  demo: boolean;
}) {
  const { t, locale } = useI18n();
  const u = UX[locale];
  const router = useRouter();
  const [proof, setProof] = useState(initial);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [checking, setChecking] = useState(true);
  const [verifyError, setVerifyError] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => setMounted(true), []);

  const verify = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setChecking(true);
    setVerifyError(false);
    try {
      const response = await call<{ result: VerificationResult }>(
        `/api/proofs/${proof.id}/verify`,
        "GET",
        request.signal,
      );
      if (!request.signal.aborted) {
        setResult(response.result);
        setCheckedAt(Date.now());
      }
    } catch {
      if (!request.signal.aborted) setVerifyError(true);
    } finally {
      if (!request.signal.aborted) setChecking(false);
    }
  }, [proof.id]);
  useEffect(() => {
    void verify();
    return () => controller.current?.abort();
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
      setProof(
        (
          await call<{ proof: PublicProof }>(
            `/api/proofs/${proof.id}/${name}`,
            "POST",
          )
        ).proof,
      );
      await verify();
    } catch (e) {
      setError(
        e instanceof ApiError && e.code && t.errors.codes[e.code]
          ? t.errors.codes[e.code]
          : t.errors.generic,
      );
    } finally {
      setBusy(null);
      setDeleteOpen(false);
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/proof/${proof.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t.cert.copyFail);
    }
  }

  const sealedAt = proof.chainTimestamp;
  const date = (seconds: number) =>
    mounted ? formatDate(seconds, locale) : "…";
  const state: SealState =
    checking || verifyError || !result
      ? "checking"
      : result.status === "VERIFIED"
        ? "ok"
        : result.status === "NOT_ON_CHAIN"
          ? "pending"
          : "bad";
  const currentChecks =
    !checking && !verifyError && result?.status !== "NOT_ON_CHAIN"
      ? result?.checks
      : undefined;
  const changedParts = currentChecks
    ? (["input", "output", "metadata"] as const)
        .filter((k) => !currentChecks[k].ok)
        .map((k) => t.cert.parts[k])
    : [];
  const states = {
    checking: {
      title: t.cert.checking,
      text: t.cert.checkingText,
      color: "text-foreground",
    },
    ok: {
      title: t.cert.genuine,
      text:
        proof.mode === "hashes"
          ? u.hashGenuine
          : t.cert.genuineText(sealedAt ? date(sealedAt) : "—"),
      color: "text-success",
    },
    bad: {
      title: t.cert.changed,
      text: changedParts.length
        ? t.cert.changedText(changedParts.join(", "))
        : t.cert.damagedText,
      color: "text-danger",
    },
    pending: {
      title: t.cert.pending,
      text: t.cert.pendingText,
      color: "text-warning",
    },
  };
  const view = verifyError
    ? {
        title: u.unavailable,
        text: u.unavailableText,
        color: "text-text-secondary",
      }
    : states[state];
  const rows = [
    {
      name: proof.mode === "hashes" ? u.hashInput : t.cert.checkRows.input[0],
      ok: currentChecks?.input.ok,
      good: proof.mode === "hashes" ? u.hashSame : t.cert.checkRows.input[1],
      bad: proof.mode === "hashes" ? u.hashChanged : t.cert.checkRows.input[2],
    },
    {
      name: proof.mode === "hashes" ? u.hashOutput : t.cert.checkRows.output[0],
      ok: currentChecks?.output.ok,
      good: proof.mode === "hashes" ? u.hashSame : t.cert.checkRows.output[1],
      bad: proof.mode === "hashes" ? u.hashChanged : t.cert.checkRows.output[2],
    },
    {
      name: t.cert.checkRows.seal[0],
      ok: currentChecks
        ? currentChecks.metadata.ok &&
          currentChecks.record.ok &&
          currentChecks.issuer.ok
        : undefined,
      good: t.cert.checkRows.seal[1],
      bad: t.cert.checkRows.seal[2],
    },
    {
      name: proof.sequence === 0 ? u.genesisLabel : u.connection,
      ok: currentChecks?.chain.ok,
      good: proof.sequence === 0 ? u.genesisGood : u.linked,
      bad: u.unlinked,
    },
  ];
  const sealWord = {
    checking: "",
    ok: t.mk.seal.genuine,
    bad: t.mk.seal.changed,
    pending: t.mk.seal.pending,
  }[state];

  return (
    <article className="page-space mx-auto max-w-[960px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <Link
          href="/history"
          className="text-text-secondary hover:text-foreground"
        >
          ← {t.cert.back}
        </Link>
        <span className="text-text-muted">
          {liveChain ? u.devnet : u.simulation}
        </span>
      </div>
      <div className="surface overflow-hidden">
        <header className="border-b px-5 py-6 sm:px-8">
          <div className="flex items-start gap-4 sm:gap-5">
            {verifyError ? (
              <Icon
                name="shield"
                className="mt-1 size-8 shrink-0 text-text-muted"
              />
            ) : (
              <SealStamp
                state={state}
                word={sealWord}
                date={
                  mounted && state === "ok" && sealedAt
                    ? new Date(sealedAt * 1000).toLocaleDateString(locale)
                    : undefined
                }
                ring={t.mk.seal.ring}
                size={76}
                className="size-16 sm:size-[76px]"
              />
            )}
            <div
              className="min-w-0 flex-1"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="data-label mb-1">
                {t.cert.certificate}
                {proof.sequence !== null ? ` · #${proof.sequence}` : ""}
              </p>
              <h1
                className={`text-2xl font-semibold leading-8 tracking-tight sm:text-[28px] sm:leading-9 ${view.color}`}
              >
                {view.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-text-secondary">
                {view.text}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {proof.status === "PENDING_CHAIN" ? (
              <Button
                variant="primary"
                onClick={() => act("retry")}
                disabled={busy !== null || checking}
              >
                <Icon name="refresh" />
                {busy === "retry" ? t.cert.retrying : t.cert.retry}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={copyLink}
                className="h-auto min-h-9 max-w-full whitespace-normal py-2 text-left"
              >
                <Icon name={copied ? "check" : "link"} />
                {copied ? t.cert.copied : t.cert.share}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => void verify()}
              disabled={checking || busy !== null}
            >
              {checking ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Icon name="refresh" />
              )}
              {t.cert.recheck}
            </Button>
            {checkedAt && !checking && !verifyError && (
              <span className="text-[13px] text-text-muted">
                {u.verifiedAt}: {date(Math.floor(checkedAt / 1000))}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="inline-error mt-4">
              {error}
            </p>
          )}
        </header>

        <section className="px-5 py-5 sm:px-8" aria-labelledby="record-title">
          <h2 id="record-title" className="section-title">
            {t.cert.certificate}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row
              k={t.cert.document}
              v={proof.inputFileName ?? t.cert.hashOnly}
            />
            <Row k={t.cert.issuedBy} v={issuerName} />
            <Row
              k={sealedAt ? t.cert.sealedOn : u.created}
              v={date(
                sealedAt ??
                  Math.floor(new Date(proof.createdAt).getTime() / 1000),
              )}
            />
            {proof.output && <Row k={t.cert.task} v={t.cert.taskValue} />}
          </dl>
        </section>

        <section
          className="border-t px-5 py-5 sm:px-8"
          aria-labelledby="checks-title"
        >
          <h2 id="checks-title" className="section-title">
            {t.cert.checksTitle}
          </h2>
          <dl className="mt-3 divide-y">
            {rows.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4 py-3 text-sm"
              >
                <dt className="text-text-secondary">{row.name}</dt>
                <dd
                  className={`flex items-start justify-end gap-2 text-right font-medium ${row.ok === undefined ? "text-text-muted" : row.ok ? "text-success" : "text-danger"}`}
                >
                  {row.ok !== undefined && (
                    <Icon
                      name={row.ok ? "check" : "x"}
                      className="mt-0.5 size-4 shrink-0"
                    />
                  )}
                  {row.ok === undefined
                    ? u.unknown
                    : row.ok
                      ? row.good
                      : row.bad}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 rounded-md bg-surface-muted px-3 py-3 text-[13px] leading-5 text-text-secondary">
            {proof.mode === "hashes" ? u.hashNote : t.cert.note}
          </p>
        </section>

        {proof.output && (
          <section
            className="border-t px-5 py-5 sm:px-8"
            aria-labelledby="result-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="result-title" className="section-title">
                {t.cert.result}
              </h2>
              {proof.isTampered && (
                <span className="text-sm font-medium text-danger">
                  {t.cert.editedBadge}
                </span>
              )}
            </div>
            {"answer" in proof.output ? (
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">
                {proof.output.answer}
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  <span className="text-sm text-text-secondary">
                    {t.cert.risk}
                  </span>
                  <strong className="text-2xl font-semibold tabular-nums">
                    {proof.output.riskScore}
                    <span className="text-sm font-normal text-text-muted">
                      {" "}
                      / 100
                    </span>
                  </strong>
                  <span className="text-sm text-text-secondary">
                    {t.cert.levels[riskLevel(proof.output.riskScore)]}
                  </span>
                </div>
                <p className="mt-3 text-[13px] text-text-secondary">
                  {proof.output.issues.length
                    ? t.cert.risksFound(proof.output.issues.length)
                    : t.cert.noRisks}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {proof.output.issues.map((issue) => (
                    <li key={issue} className="break-words">
                      {ISSUE_NAMES[locale][issue] ?? issue}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <details className="border-t px-5 py-5 sm:px-8">
          <summary className="text-sm font-medium">{t.cert.expert}</summary>
          <dl className="mt-4 grid gap-3 text-sm">
            <Row k="ID" v={proof.id} mono />
            <Row
              k={t.cert.recordNo}
              v={proof.sequence !== null ? `#${proof.sequence}` : "—"}
            />
            {proof.model && <Row k={t.cert.model} v={proof.model} mono />}
            <div className="grid gap-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
              <dt className="text-text-secondary">{t.cert.tx}</dt>
              <dd>
                {proof.explorerUrl ? (
                  <a
                    href={proof.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link inline-flex items-center gap-2"
                  >
                    Solana Explorer
                    <Icon name="external" />
                  </a>
                ) : liveChain ? (
                  "—"
                ) : (
                  u.simulation
                )}
              </dd>
            </div>
          </dl>
          {result &&
            !verifyError &&
            !checking &&
            result.status !== "NOT_ON_CHAIN" && (
              <div className="mt-5 grid gap-4 border-t pt-4">
                <p className="data-label">{t.cert.codes}</p>
                {(["input", "output", "metadata"] as const).map((k) => (
                  <div
                    key={k}
                    className="grid gap-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4"
                  >
                    <span className="text-sm text-text-secondary">
                      {t.cert.parts[k]}
                    </span>
                    <div className="grid gap-1">
                      <Hash
                        value={`${t.cert.recorded}: ${result.checks[k].stored}`}
                      />
                      <Hash
                        value={`${t.cert.now}: ${result.checks[k].current}`}
                        className={result.checks[k].ok ? "" : "text-danger"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </details>
        {proof.mode === "full" && proof.status === "ANCHORED" && (
          <div className="flex flex-wrap gap-2 border-t bg-surface-muted/50 px-5 py-4 sm:px-8">
            <LinkButton
              href={`/api/proofs/${proof.id}/evidence`}
              external
              className="h-auto min-h-9 max-w-full whitespace-normal py-1.5"
            >
              <Icon name="download" />
              {t.cert.evidence}
            </LinkButton>
            {liveChain && (
              <LinkButton
                href="/verifier.html"
                external
                variant="ghost"
                className="h-auto min-h-9 max-w-full whitespace-normal py-1.5"
              >
                <Icon name="shield" />
                {t.cert.verifier}
              </LinkButton>
            )}
          </div>
        )}
      </div>

      {demo && proof.mode === "full" && proof.status === "ANCHORED" && (
        <section className="mt-6 border-t pt-5">
          <h2 className="text-sm font-medium">{t.cert.demoTitle}</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-text-secondary">
            {liveChain ? t.cert.demoText : u.simulationDemo}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => act(proof.isTampered ? "restore" : "tamper")}
              disabled={busy !== null || checking}
            >
              <Icon name={proof.isTampered ? "refresh" : "edit"} />
              {busy
                ? t.cert.working
                : proof.isTampered
                  ? t.cert.restore
                  : t.cert.edit}
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteOpen(true)}
              disabled={busy !== null || checking}
            >
              <Icon name="trash" />
              {t.cert.delete}
            </Button>
          </div>
        </section>
      )}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{u.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{u.deleteText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy !== null}>
              {u.cancel}
            </AlertDialogCancel>
            <Button
              variant="danger"
              onClick={() => act("delete")}
              disabled={busy !== null}
            >
              {busy === "delete" ? t.cert.working : t.cert.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-text-secondary">{k}</dt>
      <dd
        className={`min-w-0 break-words [overflow-wrap:anywhere] ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {v}
      </dd>
    </div>
  );
}
