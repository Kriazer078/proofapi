"use client";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { DEV } from "@/lib/i18n/developer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/primitives";
import { CodeBlock } from "@/components/code-block";
import type { SealResult } from "@/packages/sdk/src/index";
export function Playground({ simulation }: { simulation: boolean }) {
  const { locale } = useI18n();
  const d = DEV[locale];
  const [input, setInput] = useState("Classify support ticket #42");
  const [output, setOutput] = useState("billing");
  const [model, setModel] = useState("your-model");
  const [label, setLabel] = useState("support-agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SealResult | null>(null);
  const body = { input, output, model, label };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/v1/seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(65000),
      });
      if (!res.ok)
        throw new Error(
          res.status === 401
            ? d.signedOut
            : res.status === 429
              ? "429 · " + d.error
              : d.error,
        );
      setResult(await res.json());
    } catch (e) {
      setError(
        e instanceof Error &&
          [d.signedOut, "429 · " + d.error].includes(e.message)
          ? e.message
          : d.error,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-title">{d.playground}</h1>
      <p className="page-intro">{d.playLead}</p>
      {simulation && (
        <p className="mt-3 text-sm text-warning">
          {locale === "ru"
            ? "Локальная симуляция · запись не отправляется в блокчейн"
            : locale === "kk"
              ? "Жергілікті симуляция · блокчейнге жіберілмейді"
              : "Local simulation · no blockchain transaction"}
        </p>
      )}
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
        <form onSubmit={submit} className="surface grid gap-4 p-5">
          {[
            [d.input, input, setInput],
            [d.output, output, setOutput],
          ].map(([title, value, update], i) => (
            <div key={String(title)}>
              <label htmlFor={`play-text-${i}`} className="data-label">
                {String(title)}
              </label>
              <textarea
                id={`play-text-${i}`}
                value={String(value)}
                onChange={(e) =>
                  (update as (value: string) => void)(e.target.value)
                }
                required
                maxLength={32000}
                rows={4}
                className="mt-2 block w-full resize-y rounded-md border border-border-strong bg-surface p-3 text-sm disabled:opacity-50"
                disabled={busy}
              />
            </div>
          ))}
          <div>
            <label htmlFor="play-model" className="data-label">
              {d.model}
            </label>
            <Input
              id="play-model"
              className="mt-2"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              maxLength={100}
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="play-label" className="data-label">
              {d.label}
            </label>
            <Input
              id="play-label"
              className="mt-2"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              disabled={busy}
            />
          </div>
          <p className="text-xs leading-5 text-text-muted">{d.privacy}</p>
          <Button
            type="submit"
            disabled={busy || !input.trim() || !output.trim()}
          >
            {busy ? d.sending : d.send}
          </Button>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </form>
        <div className="min-w-0 space-y-4">
          <CodeBlock
            label="POST /api/v1/seal · JSON"
            code={JSON.stringify(body, null, 2)}
            copyLabel={d.copy}
            copiedLabel={d.copied}
          />
          <h2 className="section-title">{d.response}</h2>
          {busy ? (
            <p role="status" className="text-sm text-text-secondary">
              {d.sending}
            </p>
          ) : result ? (
            <>
              <CodeBlock
                label="201 · JSON"
                code={JSON.stringify(result, null, 2)}
                copyLabel={d.copy}
                copiedLabel={d.copied}
              />
              {result.status !== "ANCHORED" && (
                <p role="status" className="text-sm text-warning">
                  {d.pending}
                </p>
              )}
              <LinkButton href={`/proof/${encodeURIComponent(result.id)}`}>
                {d.result}
              </LinkButton>
            </>
          ) : (
            <p className="border-t pt-4 text-sm text-text-secondary">
              {d.noResponse}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
