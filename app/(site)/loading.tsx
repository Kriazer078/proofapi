import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/i18n/server";
import { UX } from "@/lib/i18n/ux";

/** Shown instantly on navigation while the next page renders on the server. */
export default async function Loading() {
  const { locale } = await getMessages();
  return (
    <div className="page-space">
      <p role="status" className="sr-only">
        {UX[locale].loadingPage}
      </p>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
