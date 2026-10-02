import { SiteShell } from "@/components/site/site-shell";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteShell>
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1180px] flex-1 px-4 sm:px-6"
      >
        {children}
      </main>
      <SiteFooter />
    </SiteShell>
  );
}
