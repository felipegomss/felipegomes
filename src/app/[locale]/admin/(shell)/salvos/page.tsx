import type { Metadata } from "next";
import { getAiConfigPublic } from "@/lib/settings";
import { linkStats, listCategories, searchLinks, topTags } from "@/lib/salvos/service";
import { SalvosView } from "./_components/salvos-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Salvos" };

export default async function SalvosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const category = sp.categoria === undefined ? null : sp.categoria;
  const [result, categories, tags, stats, ai] = await Promise.all([
    searchLinks({ q: sp.q ?? "", category, limit: 120 }),
    listCategories(),
    topTags(60),
    linkStats(),
    getAiConfigPublic(),
  ]);
  return (
    <SalvosView
      locale={locale}
      items={result.items}
      total={result.total}
      stats={stats}
      categories={categories}
      tags={tags.map((t) => t.tag)}
      q={sp.q ?? ""}
      category={category}
      aiConfigured={ai.configured}
    />
  );
}
