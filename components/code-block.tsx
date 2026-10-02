"use client";
import { useState } from "react";
import { Button, Icon } from "./primitives";
import { useI18n } from "./i18n";
import { UX } from "@/lib/i18n/ux";
export function CodeBlock({
  code,
  label,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  label?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const { locale } = useI18n();
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError(true);
    }
  }
  return (
    <div className="surface min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-surface-muted/40 px-3 py-2">
        <span className="font-mono text-[13px] text-text-secondary">
          {label ?? "bash"}
        </span>
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? (
            <Icon name="check" className="pop-in size-4 text-success" />
          ) : (
            <Icon name="copy" />
          )}
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <pre
        tabIndex={0}
        aria-label={label ?? "bash"}
        className="overflow-x-auto p-4 font-mono text-[13px] leading-5"
      >
        <code>{code}</code>
      </pre>
      {copied && (
        <span role="status" className="sr-only">
          {copiedLabel}
        </span>
      )}
      {error && (
        <p role="alert" className="px-4 pb-3 text-[13px] text-danger">
          {UX[locale].copyError}
        </p>
      )}
    </div>
  );
}
