import dynamic from "next/dynamic";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { getToolBySlug, tools } from "@/lib/tools";
import { JsonTool } from "../../components/tools/json-tool";
import { JwtTool } from "../../components/tools/jwt-tool";
import { Base64Tool } from "../../components/tools/base64-tool";
import { UrlTool } from "../../components/tools/url-tool";
import { UuidTool } from "../../components/tools/uuid-tool";
import { HashTool } from "../../components/tools/hash-tool";
import { PasswordTool } from "../../components/tools/password-tool";
import { TimestampTool } from "../../components/tools/timestamp-tool";
import { ColorTool } from "../../components/tools/color-tool";
import { CaseTool } from "../../components/tools/case-tool";
import { JsonYamlTool } from "../../components/tools/json-yaml-tool";
import { RegexTool } from "../../components/tools/regex-tool";
import { CronTool } from "../../components/tools/cron-tool";
import { DiffTool } from "../../components/tools/diff-tool";
import { SlugTool } from "../../components/tools/slug-tool";
import { QrcodeTool } from "../../components/tools/qrcode-tool";
import { MarkdownTool } from "../../components/tools/markdown-tool";
import { ImageTool } from "../../components/tools/image-tool";

const PersonTool = dynamic(() =>
  import("../../components/tools/person-tool").then((m) => ({
    default: m.PersonTool,
  })),
);
const AddressTool = dynamic(() =>
  import("../../components/tools/address-tool").then((m) => ({
    default: m.AddressTool,
  })),
);
const CompanyTool = dynamic(() =>
  import("../../components/tools/company-tool").then((m) => ({
    default: m.CompanyTool,
  })),
);
const LoremTool = dynamic(() =>
  import("../../components/tools/lorem-tool").then((m) => ({
    default: m.LoremTool,
  })),
);

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

      {slug === "json" && <JsonTool />}
      {slug === "jwt" && <JwtTool />}
      {slug === "base64" && <Base64Tool />}
      {slug === "url" && <UrlTool />}
      {slug === "uuid" && <UuidTool />}
      {slug === "hash" && <HashTool />}
      {slug === "password" && <PasswordTool />}
      {slug === "timestamp" && <TimestampTool />}
      {slug === "color" && <ColorTool />}
      {slug === "case" && <CaseTool />}
      {slug === "slug" && <SlugTool />}
      {slug === "json-yaml" && <JsonYamlTool />}
      {slug === "regex" && <RegexTool />}
      {slug === "cron" && <CronTool />}
      {slug === "diff" && <DiffTool />}
      {slug === "person" && <PersonTool />}
      {slug === "address" && <AddressTool />}
      {slug === "company" && <CompanyTool />}
      {slug === "lorem" && <LoremTool />}
      {slug === "qrcode" && <QrcodeTool />}
      {slug === "markdown" && <MarkdownTool />}
      {slug === "image" && <ImageTool />}
    </>
  );
}
