import { CodeBlock } from "@/components/code-block";
import { CodeTabs } from "@/components/code-tabs";
import { LinkButton } from "@/components/primitives";
import { getMessages } from "@/lib/i18n/server";
import { DEV } from "@/lib/i18n/developer";
import {
  CURL_EXAMPLE,
  MCP_CONFIG,
  PYTHON_EXAMPLE,
  SDK_INSTALL,
  SEAL_EXAMPLE,
  VERIFY_EXAMPLE,
} from "@/lib/sdk-examples";

export default async function DevelopersPage() {
  const { locale } = await getMessages();
  const d = DEV[locale];
  const sections = [
    ["key", d.keyStep],
    ["install", d.install],
    ["request", d.requestStep],
    ["verify", d.verifyStep],
    ["hash-only", d.hashTitle],
    ["mcp", d.mcpTitle],
    ["reference", d.references],
    ["errors", d.errors],
  ];
  const code = (text: string, label: string) => (
    <CodeBlock
      code={text}
      label={label}
      copyLabel={d.copy}
      copiedLabel={d.copied}
    />
  );
  return (
    <div className="page-space">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="page-title">{d.quickstart}</h1>
          <p className="page-intro">{d.lead}</p>
        </div>
        <LinkButton href="/console/keys" variant="primary">
          {d.start}
        </LinkButton>
      </div>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label={d.docs} className="lg:sticky lg:top-20">
          <ol className="flex flex-wrap gap-x-4 gap-y-3 lg:flex-col">
            {sections.map(([id, title]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="text-sm text-text-secondary hover:text-foreground"
                >
                  {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="min-w-0 space-y-10">
          <section id="key">
            <h2 className="section-title">1. {d.keyStep}</h2>
            <p className="page-intro">{d.keyStepText}</p>
            <LinkButton href="/console/keys" className="mt-4">
              {d.start}
            </LinkButton>
            <div className="mt-4">
              {code('export PROOFAPI_API_KEY="YOUR_KEY"', "macOS / Linux")}
            </div>
            <div className="mt-3">
              {code('$env:PROOFAPI_API_KEY="YOUR_KEY"', "PowerShell")}
            </div>
          </section>
          <section id="install" className="border-t pt-8">
            <h2 className="section-title">2. {d.install}</h2>
            <p className="page-intro">{d.installNote}</p>
            <div className="mt-4">
              {code(SDK_INSTALL, "Terminal · Node.js 20+ · ESM")}
            </div>
          </section>
          <section id="request" className="border-t pt-8">
            <h2 className="section-title">3. {d.requestStep}</h2>
            <p className="page-intro">{d.requestStepText}</p>
            <div className="mt-4">
              <CodeTabs
                label={d.requestStep}
                copyLabel={d.copy}
                copiedLabel={d.copied}
                tabs={[
                  { id: "ts", title: "TypeScript", code: SEAL_EXAMPLE },
                  { id: "py", title: "Python", code: PYTHON_EXAMPLE },
                  { id: "curl", title: "cURL", code: CURL_EXAMPLE },
                ]}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-text-muted">
              {d.privacy}
            </p>
            <LinkButton href="/playground" className="mt-4">
              {d.demo}
            </LinkButton>
          </section>
          <section id="verify" className="border-t pt-8">
            <h2 className="section-title">4. {d.verifyStep}</h2>
            <p className="page-intro">{d.verifyStepText}</p>
            <div className="mt-4">{code(VERIFY_EXAMPLE, "TypeScript")}</div>
          </section>
          <section id="hash-only" className="border-t pt-8">
            <h2 className="section-title">{d.hashTitle}</h2>
            <p className="page-intro">{d.hashText}</p>
            <div className="mt-4">
              {code(
                `import { createHash, randomBytes } from 'node:crypto';
const salt = randomBytes(32); // keep the salt and original bytes
const hash = (text: string) => createHash('sha256')
  .update(Buffer.concat([salt, Buffer.from(text)])).digest('hex');
const record = await proofapi.sealHashes({
  inputHash: hash(input), outputHash: hash(answer),
  metadataHash: hash(JSON.stringify({ model: 'your-model' })),
});`,
                "TypeScript",
              )}
            </div>
          </section>
          <section id="mcp" className="border-t pt-8">
            <h2 className="section-title">{d.mcpTitle}</h2>
            <p className="page-intro">{d.mcpText}</p>
            <div className="mt-4">{code(MCP_CONFIG, "mcp.json")}</div>
            <p className="mt-3 text-sm text-text-secondary">{d.mcpNote}</p>
          </section>
          <section id="reference" className="border-t pt-8">
            <h2 className="section-title">{d.references}</h2>
            <dl className="mt-4 divide-y font-mono text-xs sm:text-sm">
              {[
                [
                  "POST /api/v1/seal",
                  "seal({ input, output, model?, label? })",
                ],
                [
                  "POST /api/proofs/hashes",
                  "sealHashes({ input_hash, output_hash, metadata_hash })",
                ],
                ["GET /api/proofs/{id}/verify", "verify(id)"],
                ["GET /api/proofs/{id}/evidence", "evidence(id)"],
              ].map(([route, method]) => (
                <div key={route} className="py-4">
                  <dt>{route}</dt>
                  <dd className="mt-1 break-all text-text-secondary">
                    {method}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              {code(
                `curl -X POST https://proofapi.vercel.app/api/v1/seal -H "Authorization: Bearer $PROOFAPI_API_KEY" -H "Content-Type: application/json" -d '{"input":"Classify ticket #42","output":"billing","model":"your-model"}'`,
                "REST · bash",
              )}
            </div>
            <LinkButton href="/new" className="mt-4">
              {d.fileDemo}
            </LinkButton>
          </section>
          <section id="errors" className="border-t pt-8">
            <h2 className="section-title">{d.errors}</h2>
            <p className="page-intro">{d.limits}</p>
            <div className="mt-4">
              {code(
                `import { ProofAPIError } from 'proofapi';
try {
  const record = await proofapi.seal({ input, output: answer });
  if (record.status === 'PENDING_CHAIN') {
    // Record saved; wait for anchoring before relying on it.
  }
} catch (error) {
  if (error instanceof ProofAPIError) {
    console.error(error.status, error.code);
    // 400 validation, 401 key, 429 limit, 500/503 service
  }
  // No automatic retries for writes: avoid duplicate records.
}`,
                "TypeScript",
              )}
            </div>
            <h3 className="mt-6 text-base font-medium">{d.config}</h3>
            <div className="mt-3">
              {code(
                `const proofapi = new ProofAPI({
  apiKey: process.env.PROOFAPI_API_KEY,
  baseURL: 'http://127.0.0.1:3000', // local server only
  timeoutMs: 65000,
});`,
                "TypeScript · local development",
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
