"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import { Icon } from "./ui";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A 4-group code people can compare by eye, derived from the real SHA-256. */
const sealCode = (hex: string) => (hex ? hex.slice(0, 16).toUpperCase().match(/.{4}/g)!.join(" ") : "···· ···· ···· ····");

/** Edit the AI answer and watch its seal stop matching. Hashes are real SHA-256. */
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

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
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

      <div
        key={String(match)}
        role="status"
        className={`flex flex-col items-center rounded-2xl border px-6 py-8 text-center ${match ? "border-ok/25 bg-ok/[0.06]" : "animate-shake border-bad/30 bg-bad/[0.07]"}`}
      >
        <span className={`grid size-14 place-items-center rounded-full ${match ? "bg-ok text-bg" : "bg-bad text-bg"}`}>
          <Icon name={match ? "check" : "x"} className="size-7" />
        </span>
        <div className={`mt-4 text-lg font-semibold ${match ? "text-ok" : "text-bad"}`}>{match ? t.demo.ok : t.demo.bad}</div>
        <div className="mt-5 grid w-full gap-1.5 font-mono text-sm">
          <div className="flex justify-between gap-3 text-muted">
            <span>{t.demo.seal}</span>
            <span>{sealCode(recorded)}</span>
          </div>
          <div className={`flex justify-between gap-3 ${match ? "text-muted" : "text-bad"}`}>
            <span>{t.cert.now}</span>
            <span>{sealCode(current)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
