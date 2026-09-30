/** Half-circle gauge for the AI risk score (0–100). */
export function RiskGauge({ value }: { value: number }) {
  const level = value >= 60 ? "High" : value >= 30 ? "Moderate" : "Low";
  const color = value >= 60 ? "var(--color-bad)" : value >= 30 ? "var(--color-warn)" : "var(--color-ok)";
  return (
    <div className="flex items-end gap-5">
      <svg viewBox="0 0 120 66" className="w-32 shrink-0" role="img" aria-label={`Risk score ${value} of 100, ${level.toLowerCase()}`}>
        <path d="M10 60a50 50 0 0 1 100 0" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="9" strokeLinecap="round" />
        <path
          d="M10 60a50 50 0 0 1 100 0"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${Math.max(1, value)} 100`}
        />
      </svg>
      <div>
        <div className="text-4xl font-semibold tabular-nums tracking-tight">
          {value}
          <span className="text-lg text-faint"> / 100</span>
        </div>
        <div className="text-sm" style={{ color }}>
          {level} risk
        </div>
      </div>
    </div>
  );
}
