"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button, Icon, LinkButton } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
export default function VerifyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  function open(e: React.FormEvent) {
    e.preventDefault();
    const id = UUID.exec(value.trim())?.[0];
    if (!id) {
      setError(true);
      return;
    }
    setOpening(true);
    router.push(`/proof/${id.toLowerCase()}`);
  }
  return (
    <div className="page-space mx-auto max-w-[640px]">
      <h1 className="page-title">{t.check.title}</h1>
      <p className="page-intro">{t.check.lead}</p>
      <form
        onSubmit={open}
        className="surface mt-6 p-5 sm:p-6"
        aria-busy={opening}
      >
        <Label htmlFor="cert-link">{t.check.label}</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            id="cert-link"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="https://…/proof/…"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={error || undefined}
            aria-describedby={error ? "link-error" : undefined}
            className="sm:flex-1"
            disabled={opening}
          />
          <Button
            type="submit"
            variant="primary"
            className="h-10"
            disabled={opening}
          >
            {opening ? t.cert.checking : t.check.button}
            <Icon name="arrow" />
          </Button>
        </div>
        {error && (
          <p id="link-error" role="alert" className="mt-3 text-sm text-danger">
            {t.check.error}
          </p>
        )}
      </form>
      <section className="mt-8 border-t pt-5">
        <h2 className="text-sm font-medium">{t.check.expertTitle}</h2>
        <p className="mt-1 text-sm text-text-secondary">{t.check.expertText}</p>
        <LinkButton href="/verifier.html" external className="mt-4">
          <Icon name="shield" />
          {t.check.expertButton}
        </LinkButton>
      </section>
    </div>
  );
}
