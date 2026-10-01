/** Short plain-language policy page: one statement per point. */
export function LegalPage({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">{title}</h1>
      <ol className="mt-10 grid gap-5">
        {points.map((p, i) => (
          <li key={p} className="grid grid-cols-[2rem_1fr] gap-2 text-[17px] leading-relaxed">
            <span className="font-mono text-sm text-faint">{i + 1}.</span>
            <span className="text-muted">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
