import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLinkIcon } from "lucide-react";
import { getToolBySlug } from "@/lib/tools";
import { ToolRenderer } from "../../../../components/tools/tool-renderer";

export default async function AppToolPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  const t = await getTranslations({ locale, namespace: "tools" });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{t(`categories.${tool.category}`)}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{t(tool.titleKey)}</h1>
          <p className="text-xs text-muted-foreground">{t(tool.descriptionKey)}</p>
        </div>
        <Link
          href={`/${locale}/tools/${tool.slug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Versão pública <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </header>
      <ToolRenderer slug={tool.slug} />
    </div>
  );
}
