import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { groupByCategory, tools } from "@/lib/tools";

export default async function AppToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });
  const groups = groupByCategory(tools);

  return (
    <div className="flex flex-col gap-8 text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Ferramentas</h1>
        <p className="text-muted-foreground">
          As mesmas tools públicas do site, abertas dentro do app.
        </p>
      </div>
      {groups.map(({ category, items }) => (
        <section key={category} className="flex flex-col gap-3" aria-labelledby={`cat-${category}`}>
          <h2 id={`cat-${category}`} className="text-xs font-semibold uppercase tracking-[0.12em]">
            {t(`categories.${category}`)}
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
            {items.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={`/${locale}/admin/tools/${tool.slug}`}
                  className="flex h-full flex-col gap-1 border p-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className="font-medium">{t(tool.titleKey)}</span>
                  <span className="text-muted-foreground">{t(tool.descriptionKey)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
