"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Icon, LinkButton, Panel } from "@/components/ui";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default function VerifyPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const id = UUID.exec(value)?.[0];
    if (!id) {
      setError("Paste a ProofAPI link or proof ID, like /proof/123e4567-e89b-…");
      return;
    }
    router.push(`/proof/${id.toLowerCase()}`);
  }

  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">Verify a proof</h1>
      <p className="mt-3 text-muted">Check that an AI result hasn&apos;t changed since it was recorded.</p>

      <form onSubmit={open} className="ring-sol mt-10 rounded-2xl bg-panel/80 p-6">
        <label htmlFor="proof-link" className="text-sm font-medium">
          Proof link or ID
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="proof-link"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="https://…/proof/…"
            className="h-11 min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-4 font-mono text-sm text-fg placeholder:text-faint focus:border-sol-purple/60 focus:outline-none"
          />
          <Button type="submit" variant="primary" className="h-11">
            Check
            <Icon name="arrow" />
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {error}
          </p>
        )}
      </form>

      <Panel className="mt-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium">Don&apos;t want to trust us?</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Download the evidence pack from a proof and open the standalone verifier. It reads Solana directly and never calls ProofAPI.
          </p>
        </div>
        <LinkButton href="/verifier.html" external>
          <Icon name="shield" />
          Open verifier
        </LinkButton>
      </Panel>
    </div>
  );
}
