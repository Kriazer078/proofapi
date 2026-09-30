"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button, Icon, LinkButton } from "@/components/ui";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default function VerifyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function open(e: React.FormEvent) {
    e.preventDefault();
    const id = UUID.exec(value)?.[0];
    if (!id) {
      setError(true);
      return;
    }
    router.push(`/proof/${id.toLowerCase()}`);
  }

  return (
    <div className="mx-auto max-w-2xl pt-16">
      <h1 className="text-4xl font-semibold tracking-[-0.03em]">{t.check.title}</h1>
      <p className="mt-3 text-lg text-muted">{t.check.lead}</p>

      <form onSubmit={open} className="ring-sol mt-10 rounded-2xl bg-panel/80 p-6">
        <label htmlFor="cert-link" className="font-medium">
          {t.check.label}
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="cert-link"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="https://…/proof/…"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-4 text-fg placeholder:text-faint focus:border-sol-purple/60 focus:outline-none"
          />
          <Button type="submit" variant="primary" className="h-12 px-6 text-base">
            {t.check.button}
            <Icon name="arrow" />
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-bad">
            {t.check.error}
          </p>
        )}
      </form>

      <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted">{t.check.expertTitle}</h2>
          <p className="mt-1 max-w-sm text-sm text-faint">{t.check.expertText}</p>
        </div>
        <LinkButton href="/verifier.html" external variant="ghost">
          <Icon name="shield" />
          {t.check.expertButton}
        </LinkButton>
      </div>
    </div>
  );
}
