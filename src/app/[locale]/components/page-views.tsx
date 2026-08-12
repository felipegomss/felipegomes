import { Eye } from "lucide-react";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db, siteCounters, PAGE_VIEWS_COUNTER } from "@/lib/db/client";
import { AnimatedCount } from "./animated-count";

const getPageViews = unstable_cache(
  async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ value: siteCounters.value })
        .from(siteCounters)
        .where(eq(siteCounters.key, PAGE_VIEWS_COUNTER));

      return row?.value ?? null;
    } catch {
      return null;
    }
  },
  ["site-page-views"],
  { revalidate: 3600 },
);

export async function PageViews({ locale }: { locale: string }) {
  const views = await getPageViews();

  if (views == null) return null;

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground-subtle">
      <Eye size={12} aria-hidden="true" />
      <AnimatedCount value={views} locale={locale} />
    </span>
  );
}
