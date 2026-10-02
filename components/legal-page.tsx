/** Short plain-language policy page: one statement per point. */
export function LegalPage({
  title,
  points,
}: {
  title: string;
  points: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl page-space">
      <h1 className="page-title">{title}</h1>
      <ol className="mt-6 grid gap-4">
        {points.map((p, i) => (
          <li
            key={p}
            className="grid grid-cols-[2rem_1fr] gap-2 text-[15px] leading-relaxed"
          >
            <span className="font-mono text-sm text-faint">{i + 1}.</span>
            <span className="text-text-secondary">{p}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
