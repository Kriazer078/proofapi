"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RiskGauge } from "@/components/risk-gauge";
import { Button, Hash, Icon, LinkButton, Panel, Pill } from "@/components/ui";
import { VerdictMark, type VerdictState } from "@/components/verdict-mark";
import { formatIso, formatUtc, shortHash } from "@/lib/format";
import type { PublicProof } from "@/lib/public-proof";
import { verdictText } from "@/lib/verification-text";
import type { VerificationResult } from "@/lib/verifier";

async function call<T>(url: string, method = "GET"): Promise<T> {
  const res = await fetch(url, { method });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

export function ProofView({ initial, liveChain }: { initial: PublicProof; liveChain: boolean }) {
  const router = useRouter();
  const [proof, setProof] = useState(initial);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const verify = useCallback(async () => {
    setResult(null);
    try {
      const { result } = await call<{ result: VerificationResult }>(`/api/proofs/${proof.id}/verify`);
      setResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [proof.id]);

  useEffect(() => {
    verify();
  }, [verify]);

  async function act(name: string, path: string) {
    setBusy(name);
    setError(null);
    try {
      if (name === "delete") {
        await call(`/api/proofs/${proof.id}/${path}`, "POST");
        router.push("/history");
        return;
      }
      const { proof: next } = await call<{ proof: PublicProof }>(`/api/proofs/${proof.id}/${path}`, "POST");
      setProof(next);
      await verify();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy. Copy the address from the browser bar instead.");
    }
  }

  const state: VerdictState = !result ? "checking" : result.status === "VERIFIED" ? "ok" : result.status === "NOT_ON_CHAIN" ? "pending" : "bad";
  const text = result ? verdictText(result) : { title: "Checking against Solana…", body: "Recomputing fingerprints and reading the record." };
  const titleColor = state === "ok" ? "text-ok" : state === "bad" ? "text-bad" : state === "pending" ? "text-warn" : "text-fg";

  return (
    <div className="pt-10">
      <Link href="/history" className="text-sm text-muted transition-colors hover:text-fg">
        ← History
      </Link>

      {/* Verdict */}
      <section className="mt-6 flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <VerdictMark state={state} />
          <div>
            <h1 className={`text-3xl font-semibold tracking-[-0.03em] sm:text-4xl ${titleColor}`} role="status">
              {text.title}
            </h1>
            <p className="mt-1.5 max-w-xl text-muted">{text.body}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {proof.status === "PENDING_CHAIN" ? (
            <Button variant="primary" onClick={() => act("retry", "retry")} disabled={busy !== null}>
              <Icon name="refresh" />
              {busy === "retry" ? "Recording…" : "Retry recording on Solana"}
            </Button>
          ) : (
            <Button variant="primary" onClick={copyLink}>
              <Icon name={copied ? "check" : "link"} />
              {copied ? "Link copied" : "Copy share link"}
            </Button>
          )}
          <Button variant="ghost" onClick={verify} disabled={!result}>
            <Icon name="refresh" />
            Re-check
          </Button>
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-6 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      {/* Facts row */}
      <dl className="mt-8 grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
        <Fact label="Record">{proof.sequence !== null ? <span className="font-mono">#{proof.sequence}</span> : "Not recorded"}</Fact>
        <Fact label="Document">{proof.inputFileName ?? "Hash-only"}</Fact>
        <Fact label="Recorded">{proof.chainTimestamp ? formatUtc(proof.chainTimestamp) : formatIso(proof.createdAt)}</Fact>
        <Fact label="On Solana">
          {proof.explorerUrl ? (
            <a href={proof.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg">
              View transaction <Icon name="external" className="size-3.5" />
            </a>
          ) : liveChain ? (
            "Pending"
          ) : (
            <span className="text-warn">Local simulation</span>
          )}
        </Fact>
      </dl>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* AI result */}
        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted">AI result</h2>
            {proof.isTampered && <Pill tone="bad">Edited in database</Pill>}
          </div>
          {proof.output ? (
            <>
              <div className="mt-6">
                <RiskGauge value={proof.output.riskScore} />
              </div>
              <p className="mt-6 text-sm text-muted">{proof.output.summary}</p>
              {proof.output.issues.length > 0 && (
                <ul className="mt-4 grid gap-2">
                  {proof.output.issues.map((issue) => (
                    <li key={issue} className="flex items-center gap-2.5 text-sm">
                      <span className="size-1.5 rounded-full bg-warn" />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-6 border-t border-line pt-4 text-xs text-faint">
                Model <span className="font-mono text-muted">{proof.model}</span> · declared by the issuer, not proven
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Hash-only proof. The content stays with its owner; only fingerprints were recorded.</p>
          )}
        </Panel>

        {/* Checks */}
        <Panel className="p-6">
          <h2 className="text-sm font-medium text-muted">What was checked</h2>
          <ul className="mt-4 divide-y divide-line">
            <CheckRow label="Document" ok={result?.checks.input.ok} detail={result?.checks.input.stored} />
            <CheckRow label="AI output" ok={result?.checks.output.ok} detail={result?.checks.output.stored} changed={result && !result.checks.output.ok ? result.checks.output.current : undefined} />
            <CheckRow label="Settings and metadata" ok={result?.checks.metadata.ok} detail={result?.checks.metadata.stored} />
            <CheckRow label="Record hash" ok={result?.checks.record.ok} detail="recomputed from on-chain fields" />
            <CheckRow
              label="Place in history"
              ok={result?.checks.chain.ok}
              detail={result ? (result.checks.chain.sequence > 0 ? `linked to #${result.checks.chain.sequence - 1}` : "first record") : undefined}
            />
            <CheckRow label="Issuer" ok={result?.checks.issuer.ok} detail={result?.checks.issuer.onChain ? shortHash(result.checks.issuer.onChain, 6, 6) : undefined} />
          </ul>
        </Panel>
      </div>

      {/* Evidence */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {proof.mode === "full" && proof.status === "ANCHORED" && (
          <LinkButton href={`/api/proofs/${proof.id}/evidence`} external>
            <Icon name="download" />
            Evidence pack
          </LinkButton>
        )}
        {liveChain && (
          <LinkButton href="/verifier.html" external variant="ghost">
            <Icon name="shield" />
            Verify without ProofAPI
          </LinkButton>
        )}
      </div>

      {/* Demo: attacks */}
      {proof.mode === "full" && proof.status === "ANCHORED" && (
        <section className="mt-14 rounded-2xl border border-dashed border-line-strong p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h2 className="font-medium">Try to cheat</h2>
              <p className="mt-1 max-w-md text-sm text-muted">Change the stored answer or hide the record. Solana keeps the original fingerprint, so the check turns red.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {proof.isTampered ? (
                <Button onClick={() => act("restore", "restore")} disabled={busy !== null}>
                  <Icon name="refresh" />
                  {busy === "restore" ? "Restoring…" : "Restore the original"}
                </Button>
              ) : (
                <Button onClick={() => act("tamper", "tamper")} disabled={busy !== null}>
                  <Icon name="edit" />
                  {busy === "tamper" ? "Editing…" : "Edit the AI answer"}
                </Button>
              )}
              <Button variant="danger" onClick={() => act("delete", "delete")} disabled={busy !== null}>
                <Icon name="trash" />
                Delete from database
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Fingerprints */}
      {result && result.status !== "NOT_ON_CHAIN" && (
        <details className="mt-6 rounded-2xl border border-line p-6 text-sm open:bg-panel/60">
          <summary className="cursor-pointer text-muted hover:text-fg">Fingerprints</summary>
          <div className="mt-4 grid gap-3">
            {(["input", "output", "metadata"] as const).map((k) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[110px_1fr]">
                <span className="text-faint capitalize">{k}</span>
                <div className="grid gap-0.5">
                  <Hash value={`on Solana  ${result.checks[k].stored}`} />
                  <Hash value={`right now  ${result.checks[k].current}`} className={result.checks[k].ok ? "" : "!text-bad"} />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-faint">{label}</dt>
      <dd className="mt-1 truncate text-fg">{children}</dd>
    </div>
  );
}

function CheckRow({ label, ok, detail, changed }: { label: string; ok: boolean | undefined; detail?: string; changed?: string }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full ${
          ok === undefined ? "border border-line-strong" : ok ? "bg-ok/15 text-ok" : "bg-bad/15 text-bad"
        }`}
      >
        {ok === undefined ? <span className="size-1.5 rounded-full bg-faint animate-pulse-dot" /> : <Icon name={ok ? "check" : "x"} className="size-3.5" />}
      </span>
      <span className="text-sm">{label}</span>
      <span className="ml-auto truncate pl-4 text-right font-mono text-xs text-faint">
        {changed ? <span className="text-bad">changed · {shortHash(changed, 6, 4)}</span> : detail && detail.length === 64 ? shortHash(detail, 6, 4) : detail}
      </span>
    </li>
  );
}
