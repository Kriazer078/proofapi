export type VerdictState = "checking" | "ok" | "bad" | "pending";

/** The large animated mark at the top of a proof: a ring that draws itself, then a check or a cross. */
export function VerdictMark({ state }: { state: VerdictState }) {
  const color = state === "ok" ? "var(--color-ok)" : state === "bad" ? "var(--color-bad)" : state === "pending" ? "var(--color-warn)" : "var(--color-faint)";
  return (
    <div className="relative size-16 shrink-0" key={state}>
      <div className="absolute inset-0 rounded-full blur-xl" style={{ background: color, opacity: state === "checking" ? 0 : 0.25 }} />
      <svg viewBox="0 0 64 64" className={`relative size-16 ${state === "checking" ? "animate-spin [animation-duration:1.4s]" : ""}`} aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" />
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={state === "checking" ? "0.25 1" : "1 1"}
          transform="rotate(-90 32 32)"
          className={state === "checking" ? "" : "animate-draw"}
        />
        {state === "ok" && <path d="M21 33l7 7 15-16" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" className="animate-draw [animation-delay:0.5s]" />}
        {state === "bad" && <path d="M23 23l18 18M41 23L23 41" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" className="animate-draw [animation-delay:0.5s]" />}
        {state === "pending" && <path d="M32 20v14m0 8v1" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />}
      </svg>
    </div>
  );
}
