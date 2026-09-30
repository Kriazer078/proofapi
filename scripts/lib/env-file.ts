/** Sets KEY=value lines in .env text. `set` always wins; `defaults` apply only to missing or empty keys. */
export function upsertEnv(text: string, set: Record<string, string>, defaults: Record<string, string> = {}): string {
  const lines = text.length ? text.replace(/\n$/, "").split("\n") : [];
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (!m) return line;
    const [, key, value] = m;
    seen.add(key);
    if (key in set) return `${key}=${set[key]}`;
    if (key in defaults && value.trim() === "") return `${key}=${defaults[key]}`;
    return line;
  });
  for (const [key, value] of Object.entries({ ...defaults, ...set })) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }
  return `${out.join("\n")}\n`;
}
