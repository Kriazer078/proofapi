import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-white",
  secondary: "bg-panel-2 text-fg border border-line-strong hover:border-white/25 hover:bg-white/[0.06]",
  ghost: "text-muted hover:text-fg hover:bg-white/[0.05]",
  danger: "bg-bad/10 text-bad border border-bad/30 hover:bg-bad/15",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({ variant = "secondary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  variant = "secondary",
  className = "",
  href,
  external,
  children,
}: { variant?: Variant; className?: string; href: string; external?: boolean; children: ReactNode }) {
  const cls = `${BASE} ${VARIANTS[variant]} ${className}`;
  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={cls} href={href}>
      {children}
    </Link>
  );
}

export function Panel({ className = "", children, ...props }: ComponentProps<"section">) {
  return (
    <section className={`rounded-2xl border border-line bg-panel/80 backdrop-blur-sm ${className}`} {...props}>
      {children}
    </section>
  );
}

export function Hash({ value, className = "" }: { value: string; className?: string }) {
  return <span className={`font-mono text-[12.5px] tracking-tight text-muted break-all ${className}`}>{value}</span>;
}

type Tone = "ok" | "bad" | "warn" | "neutral" | "sol";
const TONES: Record<Tone, string> = {
  ok: "text-ok bg-ok/10 border-ok/25",
  bad: "text-bad bg-bad/10 border-bad/25",
  warn: "text-warn bg-warn/10 border-warn/25",
  neutral: "text-muted bg-white/[0.04] border-line-strong",
  sol: "text-[#c7a6ff] bg-sol-purple/10 border-sol-purple/30",
};

export function Pill({ tone = "neutral", dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current animate-pulse-dot" />}
      {children}
    </span>
  );
}

export function Icon({ name, className = "size-4" }: { name: keyof typeof PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

const PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  upload: <path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />,
  file: <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zm0 0v5h5" />,
  external: <path d="M14 4h6v6m0-6l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />,
  copy: <path d="M9 9h10v10H9zM5 15V5h10" />,
  download: <path d="M12 4v12m0 0l-4.5-4.5M12 16l4.5-4.5M4 20h16" />,
  link: <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" />,
  arrow: <path d="M5 12h14m0 0l-6-6m6 6l-6 6" />,
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  refresh: <path d="M20 11a8 8 0 00-14.5-4.5L4 8m0-4v4h4M4 13a8 8 0 0014.5 4.5L20 16m0 4v-4h-4" />,
  trash: <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4z" />,
  spark: <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
};
