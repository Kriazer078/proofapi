import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/i18n/server";
import { UX } from "@/lib/i18n/ux";

/** Keeps the console navigation in place while a section loads. */
export default async function Loading() {
  const { locale } = await getMessages();
  return (
    <div>
      <p role="status" className="sr-only">
        {UX[locale].loadingPage}
      </p>
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64 w-full" />
    </div>
  );
}
