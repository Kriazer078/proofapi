"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Button, Icon, LinkButton } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/format";
import { UX } from "@/lib/i18n/ux";
const MAX_BYTES = 4 * 1024 * 1024;
type Phase =
  | { kind: "idle" }
  | { kind: "working"; name: string }
  | { kind: "error"; message: string };
export function NewProofForm({
  aiProvider,
  liveChain,
}: {
  aiProvider: "gemini" | "mock";
  liveChain: boolean;
}) {
  const { t, locale } = useI18n();
  const u = UX[locale];
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const working = phase.kind === "working";
  function choose(next: File) {
    if (next.size > MAX_BYTES) {
      setPhase({
        kind: "error",
        message: t.create.tooBig(next.name, formatBytes(next.size)),
      });
      setFile(null);
      return;
    }
    if (!/\.(pdf|txt)$/i.test(next.name)) {
      setPhase({ kind: "error", message: t.errors.codes.unsupported_type });
      setFile(null);
      return;
    }
    setPhase({ kind: "idle" });
    setFile(next);
  }
  async function submit(next: File) {
    if (working) return;
    setPhase({ kind: "working", name: next.name });
    const body = new FormData();
    body.append("file", next);
    try {
      const res = await fetch("/api/proofs", { method: "POST", body });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          (json.code && t.errors.codes[json.code]) ||
              t.errors.generic,
        );
      router.push(`/proof/${json.proof.id}?demo`);
    } catch (e) {
      setPhase({
        kind: "error",
        message: e instanceof Error ? e.message : t.errors.generic,
      });
    }
  }
  async function useSample() {
    if (working) return;
    try {
      const response = await fetch("/sample-contract.txt");
      if (!response.ok) throw new Error(u.sampleError);
      choose(
        new File([await response.text()], "sample-contract.txt", {
          type: "text/plain",
        }),
      );
    } catch {
      setPhase({ kind: "error", message: u.sampleError });
    }
  }
  return (
    <div className="page-space mx-auto max-w-[640px]">
      <h1 className="page-title">{t.create.title}</h1>
      <p className="page-intro">{t.create.lead}</p>
      <div className="surface mt-6 p-5 sm:p-6">
        {working ? (
          <div role="status" aria-live="polite" className="py-5">
            <div className="flex items-center gap-3">
              <LoaderCircle
                className="size-5 shrink-0 animate-spin text-text-secondary"
                aria-hidden="true"
              />
              <h2 className="section-title">{u.processing}</h2>
            </div>
            <p className="mt-3 break-words text-sm font-medium">{phase.name}</p>
            <p className="mt-2 text-sm text-text-secondary">
              {u.processingText}
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (file) void submit(file);
            }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const next = e.dataTransfer.files[0];
                if (next) choose(next);
              }}
              className={`rounded-md border border-dashed px-4 py-6 ${dragging ? "border-ring bg-success-soft" : "border-border-strong bg-surface-muted/40"}`}
            >
              <label
                htmlFor="proof-file"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Icon name="upload" />
                {t.create.drop}
              </label>
              <Input
                ref={fileInput}
                id="proof-file"
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                aria-describedby={`file-limit upload-privacy${phase.kind === "error" ? " upload-error" : ""}`}
                aria-invalid={phase.kind === "error" || undefined}
                className="mt-3 h-auto min-h-11 border-0 bg-transparent px-0"
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (next) choose(next);
                }}
              />
              <p
                id="file-limit"
                className="mt-2 text-[13px] text-text-secondary"
              >
                PDF, TXT · {t.create.limit}
              </p>
            </div>
            {file && (
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{file.name}</p>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    {formatBytes(file.size)} · {u.fileReady}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={u.replace}
                  onClick={() => {
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  <Icon name="x" />
                </Button>
              </div>
            )}
            <p
              id="upload-privacy"
              className="mt-4 text-[13px] leading-5 text-text-secondary"
            >
              {u.privacy}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-text-secondary">
              {!liveChain && aiProvider === "mock"
                ? u.mockLocal
                : aiProvider === "gemini"
                  ? t.create.noteGemini
                  : t.create.note}
            </p>
            {phase.kind === "error" && (
              <p id="upload-error" role="alert" className="inline-error mt-4">
                {phase.message}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="primary" type="submit" disabled={!file}>
                {u.upload}
                <Icon name="arrow" />
              </Button>
              <Button variant="ghost" onClick={useSample}>
                {t.create.sample}
              </Button>
            </div>
          </form>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[13px] text-text-secondary">
        <span>{t.check.expertText}</span>
        <LinkButton href="/developers" variant="ghost">
          {t.mk.nav.developers}
          <Icon name="arrow" />
        </LinkButton>
      </div>
    </div>
  );
}
