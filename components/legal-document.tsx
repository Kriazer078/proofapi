export type LegalBlock =
  | string
  | { list: string[] }
  | { table: { head: string[]; rows: string[][] } };

export interface LegalDoc {
  title: string;
  updated: string;
  intro: string[];
  toc: string;
  sections: { id: string; title: string; blocks: LegalBlock[] }[];
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  if ("list" in block)
    return (
      <ul className="grid list-disc gap-2 pl-5 marker:text-text-muted">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b bg-surface-muted/50 text-xs text-text-muted">
          <tr>
            {block.table.head.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row) => (
            <tr key={row[0]} className="border-b align-top last:border-b-0">
              {row.map((cell, i) => (
                <td key={i} className={i === 0 ? "px-4 py-3 font-mono text-[13px] text-foreground" : "px-4 py-3"}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A full legal document: title, effective date, contents and numbered sections. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="page-space">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-text-muted">{doc.updated}</p>
        <div className="mt-6 grid gap-3 text-[15px] leading-7 text-text-secondary">
          {doc.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </header>
      <div className="mt-10 grid items-start gap-10 border-t pt-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={doc.toc} className="lg:sticky lg:top-20">
          <p className="mb-3 text-sm font-medium">{doc.toc}</p>
          <ol className="grid gap-2 text-sm">
            {doc.sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-text-secondary transition-colors hover:text-foreground">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="grid min-w-0 max-w-3xl gap-10">
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="grid gap-4 text-[15px] leading-7 text-text-secondary">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {i + 1}. {s.title}
              </h2>
              {s.blocks.map((b, j) => (
                <Block key={j} block={b} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
