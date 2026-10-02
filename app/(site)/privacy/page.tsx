import { LegalPage } from "@/components/legal-page";
import { getMessages } from "@/lib/i18n/server";

export default async function PrivacyPage() {
  const { t } = await getMessages();
  return (
    <LegalPage title={t.mk.legal.privacyTitle} points={t.mk.legal.privacy} />
  );
}
