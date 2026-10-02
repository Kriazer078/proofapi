"use client";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n";
import { Button, LinkButton } from "@/components/primitives";
import { UX } from "@/lib/i18n/ux";
export default function PageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale } = useI18n();
  const u = UX[locale];
  const journal = usePathname() === "/history";
  return (
    <section
      className="page-space mx-auto max-w-[640px]"
      aria-labelledby="error-title"
    >
      <p className="data-label">ProofAPI</p>
      <h1 id="error-title" className="page-title mt-2">
        {journal ? u.journalError : u.unavailable}
      </h1>
      <p role="alert" className="page-intro">
        {journal ? u.journalErrorText : u.unavailableText}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" onClick={reset}>
          {t.cert.retry}
        </Button>
        <LinkButton href="/verify">{t.nav.check}</LinkButton>
      </div>
    </section>
  );
}
