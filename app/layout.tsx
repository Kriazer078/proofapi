import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofAPI — Git history for AI",
  description: "Tamper-evident, independently verifiable records of what your AI received and returned.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
