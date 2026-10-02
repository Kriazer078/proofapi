import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { getMessages } from "@/lib/i18n/server";
import { PRIVACY } from "@/lib/i18n/privacy";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const { locale } = await getMessages();
  return <LegalDocument doc={PRIVACY[locale]} />;
}
