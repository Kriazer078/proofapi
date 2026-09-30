import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { getChainMode } from "@/lib/config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  title: "ProofAPI",
  description: "Tamper-evident records of what your AI received and returned, anchored on Solana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <div className="atmosphere" aria-hidden="true" />
        <NavBar mode={getChainMode()} programId={process.env.PROGRAM_ID ?? null} />
        <main className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">{children}</main>
      </body>
    </html>
  );
}
