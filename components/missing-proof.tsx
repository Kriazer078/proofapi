import { getMessages } from "@/lib/i18n/server";
import { UX } from "@/lib/i18n/ux";
import { LinkButton } from "@/components/primitives";
export async function MissingProof() {
  const { t, locale } = await getMessages();
  const u = UX[locale];
  return (
    <section className="page-space mx-auto max-w-[640px]">
      <p className="data-label">404 · ProofAPI</p>
      <h1 className="page-title mt-2">{u.missing}</h1>
      <p className="page-intro">{u.missingText}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href="/verify" variant="primary">
          {t.nav.check}
        </LinkButton>
        <LinkButton href="/verifier.html" external>
          {t.cert.verifier}
        </LinkButton>
      </div>
    </section>
  );
}
