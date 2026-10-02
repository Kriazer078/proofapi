import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/lib/i18n/server";
import { UX } from "@/lib/i18n/ux";
export default async function Loading() {
  const { t, locale } = await getMessages();
  return (
    <div className="page-space">
      <h1 className="page-title">{t.journal.title}</h1>
      <p role="status" className="page-intro">
        {UX[locale].loading}
      </p>
      <div className="surface mt-6 space-y-4 p-5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
