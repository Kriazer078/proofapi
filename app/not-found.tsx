import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { MissingProof } from "@/components/missing-proof";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[1180px] flex-1 px-4 sm:px-6"
      >
        <MissingProof />
      </main>
      <SiteFooter />
    </div>
  );
}
