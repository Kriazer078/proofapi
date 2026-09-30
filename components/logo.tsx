/** Two linked blocks: a record and the one before it. */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="proofapi-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect x="2" y="7" width="9" height="10" rx="2.5" fill="url(#proofapi-logo)" opacity="0.55" />
      <rect x="13" y="4" width="9" height="16" rx="2.5" fill="url(#proofapi-logo)" />
      <path d="M11 12h2" stroke="#14F195" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 12.2l1.6 1.6 3-3.3" fill="none" stroke="#07080b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
