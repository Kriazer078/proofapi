import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { getMessages } from "@/lib/i18n/server";
import { TERMS } from "@/lib/i18n/terms";

export const metadata: Metadata = { title: "Terms of Use" };

export default async function TermsPage() {
  const { locale } = await getMessages();
  return <LegalDocument doc={TERMS[locale]} />;
}
