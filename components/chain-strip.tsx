import Link from "next/link";
import { formatUtc, shortHash } from "@/lib/format";

export interface ChainItem {
  id: string;
  sequence: number;
  fileName: string | null;
  recordHash: string;
  timestamp: number | null;
  tampered: boolean;
}

/** The latest real records of our issuer, drawn as linked blocks. */
export function ChainStrip({ items }: { items: ChainItem[] }) {
  return (
    <div className="flex items-stretch overflow-x-auto pb-2 [scrollbar-width:thin]">
      {items.map((item, i) => (
        <div key={item.id} className="flex shrink-0 items-center">
          {i > 0 && <div className="chain-link h-0.5 w-8 sm:w-12" aria-hidden="true" />}
          <Link
            href={`/proof/${item.id}`}
            className="group w-52 rounded-xl border border-line bg-panel/80 p-4 transition-colors hover:border-white/20 hover:bg-panel-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-faint">#{item.sequence}</span>
              <span className={`size-2 rounded-full ${item.tampered ? "bg-bad" : "bg-ok"}`} aria-label={item.tampered ? "edited in database" : "intact"} />
            </div>
            <div className="mt-3 truncate text-sm font-medium text-fg">{item.fileName ?? "Hash-only record"}</div>
            <div className="mt-1 font-mono text-xs text-muted">{shortHash(item.recordHash, 8, 6)}</div>
            <div className="mt-3 text-[11px] text-faint">{item.timestamp ? formatUtc(item.timestamp) : "—"}</div>
          </Link>
        </div>
      ))}
    </div>
  );
}
