export type SealState = "checking" | "ok" | "bad" | "pending";

const COLOR: Record<SealState, string> = {
  checking: "var(--color-faint)",
  ok: "var(--color-ok)",
  bad: "var(--color-bad)",
  pending: "var(--color-warn)",
};

/**
 * The certificate's status drawn as a notary-style seal: the product promise is a digital seal,
 * so the verdict is a stamp rather than a generic check icon.
 */
export function SealStamp({ state, word, date, ring, size = 112 }: { state: SealState; word: string; date?: string; ring: string; size?: number }) {
  const color = COLOR[state];
  const id = `seal-ring-${state}`;
  return (
    <svg
      key={state}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 ${state === "checking" ? "animate-spin [animation-duration:6s]" : "animate-stamp"}`}
      style={{ color, transform: state === "checking" ? undefined : "rotate(-8deg)" }}
      role="img"
      aria-label={word}
    >
      <defs>
        <path id={id} d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={state === "checking" ? "6 6" : undefined} />
      <circle cx="60" cy="60" r="37" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      {state !== "checking" && (
        <>
          {/* One lap of text: textLength stretches it to the circle (2π·45 ≈ 283) so it never overlaps itself. */}
          <text fill="currentColor" fontSize="8" fontWeight="600" fontFamily="var(--font-mono)">
            <textPath href={`#${id}`} startOffset="0" textLength="280" lengthAdjust="spacingAndGlyphs">
              {ring}
            </textPath>
          </text>
          <text x="60" y={date ? 58 : 64} textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" textLength={word.length > 8 ? 62 : undefined} lengthAdjust="spacingAndGlyphs">
            {word}
          </text>
          {date && (
            <text x="60" y="73" textAnchor="middle" fill="currentColor" fontSize="7.5" fontFamily="var(--font-mono)" opacity="0.85">
              {date}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
