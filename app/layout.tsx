import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Literata } from "next/font/google";
import { I18nProvider } from "@/components/i18n";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const display = Literata({ subsets: ["latin", "cyrillic"], axes: ["opsz"], variable: "--font-literata", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ProofAPI — prove what your AI did", template: "%s · ProofAPI" },
  description: "ProofAPI seals every AI decision on Solana. Anyone can check it with a link, without trusting the operator.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <I18nProvider locale={locale}>
          {children}
          <Toaster position="bottom-right" />
        </I18nProvider>
      </body>
    </html>
  );
}
