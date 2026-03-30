import { Eye } from "lucide-react";
import { UMAMI_WEBSITE_ID } from "@/lib/constants";

type UmamiStats = {
  pageviews?: number;
};

async function getPageViews(): Promise<number | null> {
  const key = process.env.UMAMI_API_KEY;
  if (!key) return null;

  try {
    const endAt = Math.floor(Date.now() / 3_600_000) * 3_600_000;
    const res = await fetch(
      `https://api.umami.is/v1/websites/${UMAMI_WEBSITE_ID}/stats?startAt=0&endAt=${endAt}`,
      {
        headers: { "x-umami-api-key": key },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data: UmamiStats = await res.json();
    return data.pageviews ?? null;
  } catch {
    return null;
  }
}

export async function PageViews({ locale }: { locale: string }) {
  const views = await getPageViews();

  if (views == null) return null;

  const formatted = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(views);

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground-subtle">
      <Eye size={12} aria-hidden="true" />
      {formatted}
    </span>
  );
}
