"use client";
import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import { SealStamp } from "./seal-stamp";
import { Button, Icon } from "./primitives";
async function sha256(text: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export function TamperDemo() {
  const { t } = useI18n();
  const [edited, setEdited] = useState(false);
  const [hashes, setHashes] = useState<{
    original: string;
    current: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const lines = t.demo.lines.map(([k, v]) => [
    k,
    edited ? v.replace("31 / 100", "12 / 100") : v,
  ]);
  useEffect(() => {
    let active = true;
    setHashes(null);
    setFailed(false);
    const text = (ls: string[][]) =>
      ls.map(([k, v]) => `${k}: ${v}`).join("\n");
    const current = t.demo.lines.map(([k, v]) => [
      k,
      edited ? v.replace("31 / 100", "12 / 100") : v,
    ]);
    Promise.all([sha256(text(t.demo.lines)), sha256(text(current))])
      .then(([original, now]) => {
        if (active) setHashes({ original, current: now });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [edited, t]);
  const match = hashes?.original === hashes?.current;
  return (
    <div className="surface grid overflow-hidden md:grid-cols-2">
      <div className="p-5">
        <h3 className="data-label">{t.demo.label}</h3>
        <dl className="mt-3 space-y-2 text-sm">
          {lines.map(([k, v], i) => (
            <div
              key={k}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4"
            >
              <dt className="text-text-secondary">{k}</dt>
              <dd
                className={`break-words ${v !== t.demo.lines[i][1] ? "font-medium text-danger" : ""}`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <Button
          className="mt-5"
          onClick={() => setEdited(!edited)}
          disabled={!hashes && !failed}
        >
          <Icon name={edited ? "refresh" : "edit"} />
          {edited ? t.demo.restore : t.demo.fake}
        </Button>
      </div>
      <div className="border-t bg-surface-muted/40 p-5 md:border-t-0 md:border-l">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3"
        >
          <SealStamp
            state={!hashes ? "checking" : match ? "ok" : "bad"}
            word={!hashes ? "" : match ? t.mk.seal.genuine : t.mk.seal.changed}
            ring={t.mk.seal.ring}
            size={56}
          />
          <p
            className={`text-sm font-semibold ${!hashes ? "text-text-secondary" : match ? "text-success" : "text-danger"}`}
          >
            {failed
              ? t.errors.generic
              : !hashes
                ? t.cert.checking
                : match
                  ? t.demo.ok
                  : t.demo.bad}
          </p>
        </div>
        <dl className="mt-4 space-y-3">
          {[
            [t.demo.seal, hashes?.original],
            [t.cert.now, hashes?.current],
          ].map(([label, code]) => (
            <div key={label}>
              <dt className="text-[13px] text-text-secondary">{label}</dt>
              <dd className="mt-1 break-all font-mono text-[13px]">
                {code
                  ? code.slice(0, 16).toUpperCase().match(/.{4}/g)?.join(" ")
                  : "…"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
