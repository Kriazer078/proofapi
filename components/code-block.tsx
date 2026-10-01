"use client";

import { useState } from "react";
import { Icon } from "./ui";

/** A code sample with a copy button. Scrolls sideways inside itself on narrow screens. */
export function CodeBlock({ code, label, copyLabel, copiedLabel }: { code: string; label?: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-faint">{label ?? "bash"}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg">
          <Icon name={copied ? "check" : "copy"} className="size-3.5" />
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
