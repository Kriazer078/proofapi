export type RiskLevel = "low" | "moderate" | "high";

export function riskLevel(value: number): RiskLevel {
  return value >= 60 ? "high" : value >= 30 ? "moderate" : "low";
}

const COLOR: Record<RiskLevel, string> = { low: "var(--color-ok)", moderate: "var(--color-warn)", high: "var(--color-bad)" };

/** Half-circle gauge for the AI risk score (0–100). */
export function RiskGauge({ value, levelLabel, riskLabel }: { value: number; levelLabel: string; riskLabel: string }) {
  const color = COLOR[riskLevel(value)];
  return (
    <div className="flex items-end gap-5">
      <svg viewBox="0 0 120 66" className="w-28 shrink-0" role="img" aria-label={`${riskLabel}: ${value} / 100, ${levelLabel}`}>
        <path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="9" strokeLinecap="round" />
        <path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" pathLength={100} strokeDasharray={`${Math.max(1, value)} 100`} />
      </svg>
      <div>
        <div className="text-4xl font-semibold tabular-nums tracking-tight">
          {value}
          <span className="text-lg text-faint"> / 100</span>
        </div>
        <div className="text-sm" style={{ color }}>
          {riskLabel}: {levelLabel}
        </div>
      </div>
    </div>
  );
}
