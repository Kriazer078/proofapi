"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BLOCK = 116;
const GAP = 26;
const STEP = BLOCK + GAP;
const VISIBLE = 9;

interface Item {
  seq: number;
  hash: string;
  fresh: boolean;
}

/** Deterministic fake fingerprint, so the server and the browser render the same first frame. */
function fingerprint(seq: number) {
  return ((seq * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 4) + "…";
}

function initial(): Item[] {
  return Array.from({ length: VISIBLE }, (_, i) => {
    const seq = 1034 + i;
    return { seq, hash: fingerprint(seq), fresh: i === VISIBLE - 1 };
  });
}

/** A slow, illustrative chain: a new linked record arrives every few seconds. Example data only. */
export function LiveChain({ example }: { example: string }) {
  const [items, setItems] = useState(initial);
  const [offset, setOffset] = useState(0);
  const [ticked, setTicked] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [animated, setAnimated] = useState(false);
  const visible = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
    const onVisibility = () => {
      visible.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      if (!visible.current) return;
      setAnimated(true);
      setItems((prev) => {
        const seq = prev[prev.length - 1].seq + 1;
        return [
          ...prev.map((p) => ({ ...p, fresh: false })),
          { seq, hash: fingerprint(seq), fresh: true },
        ];
      });
      setTicked(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [paused]);

  // Drop records that have scrolled away, then reset the offset without a visible jump.
  useEffect(() => {
    if (items.length <= VISIBLE + 4) return;
    const t = setTimeout(() => {
      setAnimated(false);
      setItems((prev) => prev.slice(4));
    }, 1000);
    return () => clearTimeout(t);
  }, [items.length]);

  // Keep the newest record in view, a little inside the right fade.
  useLayoutEffect(() => {
    const measure = () => {
      if (!box.current || !strip.current) return;
      const room = box.current.clientWidth - Math.min(140, box.current.clientWidth * 0.18);
      setOffset(Math.max(0, strip.current.scrollWidth - room));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [items]);

  const last = items.length - 1;
  return (
    <div className="min-w-0">
      <div ref={box} className="chain-mask overflow-hidden py-6" aria-hidden="true">
        <div
          ref={strip}
          className={cn(
            "flex w-max items-center",
            animated && "transition-transform duration-900 ease-[var(--ease-out)]",
          )}
          style={{ transform: `translateX(${-offset}px)` }}
        >
          {items.map((item, i) => (
            <div key={item.seq} className="flex items-center">
              {i > 0 && (
                <i
                  className={cn(
                    "block h-0.5 bg-border-strong",
                    i === last && ticked && "chain-link-enter",
                  )}
                  style={{ width: GAP }}
                />
              )}
              <div
                className={cn(
                  "flex h-[78px] flex-col justify-between rounded-[9px] border px-3 py-2.5 font-mono text-xs transition-colors duration-700",
                  item.fresh
                    ? "border-success bg-success-soft text-success"
                    : "border-border-strong bg-surface text-text-muted",
                  i === last && ticked && "chain-enter",
                )}
                style={{ width: BLOCK }}
              >
                <span className={item.fresh ? "text-success" : "text-text-secondary"}>
                  #{item.seq}
                </span>
                <span>{item.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center text-[12.5px] text-text-muted">
        <span className="inline-flex items-center gap-2">
          <i className="live-dot block size-[7px] rounded-full bg-success" />
          {example}
        </span>
      </div>
    </div>
  );
}
