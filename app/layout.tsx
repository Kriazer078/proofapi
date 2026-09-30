import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/components/i18n";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  title: "ProofAPI",
  description: "A digital seal for AI answers. Anyone can check it with a link.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <I18nProvider locale={locale}>
          <div className="atmosphere" aria-hidden="true" />
          <NavBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 sm:px-8">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
