import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { getToolBySlug, tools } from "@/lib/tools";
import { ToolRenderer } from "../../components/tools/tool-renderer";
export function generateStaticParams() {
  return tools.flatMap((tool) =>
    routing.locales.map((locale) => ({ locale, slug: tool.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  const t = await getTranslations({ locale, namespace: "tools" });
  const url = `${BASE_URL}/${locale}/tools/${slug}`;

  return {
    title: `${t(tool.titleKey)} — LFNG`,
    description: t(tool.descriptionKey),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/tools/${slug}`]),
      ),
    },
    openGraph: {
      title: `${t(tool.titleKey)} — LFNG`,
      description: t(tool.descriptionKey),
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${t(tool.titleKey)} — LFNG`,
      description: t(tool.descriptionKey),
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const t = await getTranslations({ locale, namespace: "tools" });

  return (
    <>
      <header className="mb-8 border-b border-border pb-6">
        <p className="mb-1.5 text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
          {t(`categories.${tool.category}`)}
        </p>
        <h1 className="font-heading text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          {t(tool.titleKey)}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t(tool.descriptionKey)}
        </p>
      </header>

      <ToolRenderer slug={tool.slug} />
    </>
  );
}
