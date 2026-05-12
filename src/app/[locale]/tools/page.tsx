import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { groupByCategory, tools } from "@/lib/tools";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });
  const url = `${BASE_URL}/${locale}/tools`;

  return {
    title: `${t("title")} — LFNG`,
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/tools`]),
      ),
    },
    openGraph: {
      title: `${t("title")} — LFNG`,
      description: t("metaDescription"),
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("title")} — LFNG`,
      description: t("metaDescription"),
    },
  };
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "tools" });
  const groups = groupByCategory(tools);

  return (
    <>
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="mb-3 text-2xs font-bold uppercase tracking-widest text-muted-foreground">
              {t(`categories.${group.category}`)}
            </h2>
            <ul
              role="list"
              className="grid grid-cols-1 gap-px overflow-hidden border border-border sm:grid-cols-2"
            >
              {group.items.map((tool) => (
                <li key={tool.slug} className="bg-background">
                  <Link
                    href={`/${locale}/tools/${tool.slug}`}
                    className="block h-full p-4 transition-colors hover:bg-muted/40"
                  >
                    <h3 className="font-heading text-sm font-black tracking-tight">
                      {t(tool.titleKey)}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {t(tool.descriptionKey)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
