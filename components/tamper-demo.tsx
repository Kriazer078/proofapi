"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import { SealStamp } from "./seal-stamp";
import { Icon } from "./primitives";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** First 16 hex characters of the real SHA-256, in four blocks people can compare by eye. */
const blocks = (hex: string) => (hex ? hex.slice(0, 16).toUpperCase().match(/.{4}/g)! : ["····", "····", "····", "····"]);

/** Edit the AI answer and watch the seal code stop matching. Hashes are real SHA-256. */
export function TamperDemo() {
  const { t } = useI18n();
  const original = t.demo.lines;
  const edited = original.map(([k, v]) => [k, v.replace("31 / 100", "12 / 100")] as [string, string]);
  const [isEdited, setEdited] = useState(false);
  const [recorded, setRecorded] = useState("");
  const [current, setCurrent] = useState("");
  const lines = isEdited ? edited : original;
  const join = (ls: [string, string][]) => ls.map(([k, v]) => `${k}: ${v}`).join("\n");

  useEffect(() => {
    sha256(join(original)).then(setRecorded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
  useEffect(() => {
    sha256(join(lines)).then(setCurrent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdited, t]);

  const match = recorded !== "" && recorded === current;
  const rec = blocks(recorded);
  const now = blocks(current);

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-stretch">
      <div className="rounded-2xl border border-line bg-panel/80 p-5">
        <div className="text-xs font-medium text-faint">{t.demo.label}</div>
        <dl className="mt-3 grid gap-2 text-[15px]">
          {lines.map(([k, v], i) => {
            const changed = v !== original[i][1];
            return (
              <div key={k} className={`grid grid-cols-[minmax(0,11rem)_1fr] gap-3 rounded-md px-2 py-1 transition-colors ${changed ? "bg-bad/15" : ""}`}>
                <dt className="text-muted">{k}</dt>
                <dd className={changed ? "font-semibold text-bad" : "text-fg"}>{v}</dd>
              </div>
            );
          })}
        </dl>
        <button
          type="button"
          onClick={() => setEdited((v) => !v)}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-sm font-medium transition-colors hover:bg-white/[0.06]"
        >
          <Icon name={isEdited ? "refresh" : "edit"} />
          {isEdited ? t.demo.restore : t.demo.fake}
        </button>
      </div>

      <div role="status" className="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-panel/80 p-5">
        <div className="flex items-center gap-4">
          <SealStamp
            state={recorded ? (match ? "ok" : "bad") : "checking"}
            word={match ? t.mk.seal.genuine : t.mk.seal.changed}
            ring={t.mk.seal.ring}
            size={84}
          />
          <div className={`text-lg font-semibold ${match ? "text-ok" : "text-bad"}`}>{match ? t.demo.ok : t.demo.bad}</div>
        </div>
        <div className="grid gap-3 font-mono text-sm">
          <CodeRow label={t.demo.seal} codes={rec} />
          <CodeRow label={t.cert.now} codes={now} compare={rec} />
        </div>
      </div>
    </div>
  );
}

function CodeRow({ label, codes, compare }: { label: string; codes: string[]; compare?: string[] }) {
  return (
    <div>
      <div className="mb-1.5 font-sans text-xs text-faint">{label}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {codes.map((c, i) => {
          const differs = compare !== undefined && compare[i] !== c;
          return (
            <span key={i} className={`rounded-md border px-2 py-1 text-center transition-colors ${differs ? "border-bad/40 bg-bad/10 text-bad" : "border-line-strong text-muted"}`}>
              {c}
            </span>
          );
        })}
      </div>
    </div>
  );
}
