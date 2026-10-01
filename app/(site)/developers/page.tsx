import { CodeBlock } from "@/components/code-block";
import { Icon, LinkButton } from "@/components/primitives";
import { GITHUB_URL } from "@/lib/i18n/marketing";
import { getMessages } from "@/lib/i18n/server";

const BASE = "https://proofapi.vercel.app";

const EXAMPLES = [
  {
    lang: "bash",
    code: `curl -F file=@contract.pdf ${BASE}/api/proofs`,
    response: `{
  "proof": {
    "id": "c3f1…-…",
    "status": "ANCHORED",
    "sequence": 12,
    "output": { "riskScore": 31, "issues": ["Termination clause", "Liability risk"] },
    "explorerUrl": "https://explorer.solana.com/tx/…?cluster=devnet"
  },
  "chainError": null
}`,
  },
  {
    lang: "javascript",
    code: `import { createHash, randomBytes } from "node:crypto";

const salt = randomBytes(32); // keep it: you need it to prove the content later
const seal = (data) =>
  createHash("sha256").update(Buffer.concat([salt, Buffer.from(data)])).digest("hex");

const res = await fetch("${BASE}/api/proofs/hashes", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    input_hash: seal(documentText),
    output_hash: seal(aiAnswer),
    metadata_hash: seal(JSON.stringify({ model: "your-model" })),
  }),
});
const { proof } = await res.json(); // proof.id, proof.sequence, proof.explorerUrl`,
    response: null,
  },
  {
    lang: "bash",
    code: `curl ${BASE}/api/proofs/{id}/verify`,
    response: `{
  "result": {
    "status": "VERIFIED",
    "checks": {
      "input": { "ok": true }, "output": { "ok": true }, "metadata": { "ok": true },
      "record": { "ok": true }, "chain": { "ok": true, "sequence": 12 }, "issuer": { "ok": true }
    },
    "onChainTimestamp": 1790800000
  }
}`,
  },
  {
    lang: "bash",
    code: `curl -o evidence.json ${BASE}/api/proofs/{id}/evidence`,
    response: null,
  },
];

export default async function DevelopersPage() {
  const { t } = await getMessages();
  const d = t.mk.dev;
  return (
    <div className="pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">{d.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{d.lead}</p>

      <dl className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">{d.baseUrl}</dt>
        <dd className="font-mono text-fg">{BASE}</dd>
      </dl>
      <p className="mt-2 text-sm text-muted">{d.limits}</p>

      <div className="mt-14 grid gap-16">
        {d.sections.map((section, i) => {
          const ex = EXAMPLES[i];
          return (
            <section key={section.title} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
              <div>
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{section.title}</h2>
                <p className="mt-2 text-muted">{section.text}</p>
                {i === 3 && (
                  <LinkButton href="/verifier.html" external className="mt-6">
                    <Icon name="shield" />
                    {d.openVerifier}
                  </LinkButton>
                )}
              </div>
              <div className="grid min-w-0 gap-3">
                <CodeBlock code={ex.code} label={ex.lang} copyLabel={d.copy} copiedLabel={d.copied} />
                {ex.response && <CodeBlock code={ex.response} label={`${d.response} · json`} copyLabel={d.copy} copiedLabel={d.copied} />}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-20 border-t border-line pt-8">
        <LinkButton href={GITHUB_URL} external variant="ghost">
          {d.source}
          <Icon name="external" />
        </LinkButton>
      </div>
    </div>
  );
}
