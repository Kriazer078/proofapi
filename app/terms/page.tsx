import { LegalPage } from "@/components/legal-page";
import { getMessages } from "@/lib/i18n/server";

export default async function TermsPage() {
  const { t } = await getMessages();
  return <LegalPage title={t.mk.legal.termsTitle} points={t.mk.legal.terms} />;
}
