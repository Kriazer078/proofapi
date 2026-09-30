import { ChainStrip, type ChainItem } from "@/components/chain-strip";
import { TamperDemo } from "@/components/tamper-demo";
import { Icon, LinkButton } from "@/components/ui";
import { getServices } from "@/lib/services";

export const dynamic = "force-dynamic";

async function latestRecords(): Promise<ChainItem[]> {
  const rows = await getServices().repo.list();
  return rows
    .filter((r) => r.status === "ANCHORED" && r.sequence !== null && r.recordHash)
    .sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0))
    .slice(0, 5)
    .reverse()
    .map((r) => ({
      id: r.id,
      sequence: r.sequence!,
      fileName: r.inputFileName,
      recordHash: r.recordHash!,
      timestamp: r.chainTimestamp,
      tampered: r.tamperedBackupJson !== null,
    }));
}

const STEPS = [
  { icon: "upload", title: "Run the AI task", text: "Upload a document or call the API." },
  { icon: "shield", title: "Fingerprint it", text: "Input, output and settings are hashed. The text stays private." },
  { icon: "link", title: "Anchor on Solana", text: "Our program numbers and chains every record." },
  { icon: "check", title: "Anyone verifies", text: "Share a link. Checks run against Solana, not us." },
] as const;

export default async function HomePage() {
  const records = await latestRecords();
  return (
    <>
      <section className="grid items-center gap-12 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="animate-fade-up">
          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-balance sm:text-6xl lg:text-[68px]">
            Proof that your AI said it.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted text-balance">
            Every AI answer gets a fingerprint on Solana. Change one character and anyone can see it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <LinkButton href="/new" variant="primary" className="h-11 px-5">
              Create a proof
              <Icon name="arrow" />
            </LinkButton>
            <LinkButton href="/verify" className="h-11 px-5">
              Verify a proof
            </LinkButton>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <TamperDemo />
        </div>
      </section>

      {records.length > 0 && (
        <section className="animate-fade-up [animation-delay:200ms]">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted">Latest records on Solana</h2>
            <a href="/history" className="text-sm text-muted transition-colors hover:text-fg">
              Full history →
            </a>
          </div>
          <ChainStrip items={records} />
        </section>
      )}

      <section className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="bg-bg p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg border border-line-strong text-fg">
                <Icon name={s.icon} />
              </span>
              <span className="font-mono text-xs text-faint">0{i + 1}</span>
            </div>
            <h3 className="mt-5 font-medium">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{s.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
