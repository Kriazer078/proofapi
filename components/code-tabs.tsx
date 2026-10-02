"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { CodeBlock } from "./code-block";
import { cn } from "@/lib/utils";

/** The same request in several languages. The underline slides to the chosen tab. */
export function CodeTabs({
  tabs,
  copyLabel,
  copiedLabel,
  label,
}: {
  tabs: { id: string; title: string; code: string }[];
  copyLabel: string;
  copiedLabel: string;
  label: string;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bar, setBar] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const place = () => {
      const el = refs.current[active];
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  function onKey(event: React.KeyboardEvent, i: number) {
    const next =
      event.key === "ArrowRight" ? (i + 1) % tabs.length : event.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : -1;
    if (next < 0) return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  const current = tabs[active];
  return (
    <div className="min-w-0">
      <div role="tablist" aria-label={label} className="relative mb-3 flex gap-1 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(event) => onKey(event, i)}
            className={cn(
              "h-9 rounded-md px-3 text-sm transition-colors hover:bg-surface-muted",
              i === active ? "text-foreground" : "text-text-secondary",
            )}
          >
            {tab.title}
          </button>
        ))}
        <span
          aria-hidden="true"
          className="absolute -bottom-px left-0 h-0.5 rounded-full bg-success transition-[transform,width] duration-300 ease-[var(--ease-out)]"
          style={{ width: bar.width, transform: `translateX(${bar.left}px)` }}
        />
      </div>
      <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
        <CodeBlock code={current.code} label={current.title} copyLabel={copyLabel} copiedLabel={copiedLabel} />
      </div>
    </div>
  );
}
