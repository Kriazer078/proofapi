/** Two linked blocks: a record and the one before it. Ink, with the link in seal green. */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="7" width="9" height="10" rx="2.5" fill="currentColor" opacity="0.32" />
      <rect x="13" y="4" width="9" height="16" rx="2.5" fill="currentColor" />
      <path d="M11 12h2" stroke="var(--seal)" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 12.2l1.6 1.6 3-3.3" fill="none" stroke="var(--card)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
