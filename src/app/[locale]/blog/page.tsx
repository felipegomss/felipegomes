import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { BASE_URL } from "@/lib/constants";
import { getAllPosts } from "@/lib/blog";
import { BlogPostCard } from "../components/blog-post-card";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const url = `${BASE_URL}/${locale}/blog`;

  return {
    title: `${t("title")} — LFNG`,
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/blog`]),
      ),
    },
    openGraph: {
      title: `${t("title")} — LFNG`,
      description: t("metaDescription"),
      type: "website",
      url,
      images: [{ url: `${BASE_URL}/og.png`, width: 1200, height: 630 }],
      siteName: "LFNG",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("title")} — LFNG`,
      description: t("metaDescription"),
      images: [`${BASE_URL}/og.png`],
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = await getAllPosts(locale);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:py-24"
    >
      <div className="mb-8">
        <Link
          href={`/${locale}`}
          className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← lfng.dev
        </Link>
      </div>

      <header className="mb-12">
        <h1 className="font-heading text-3xl font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border" role="list">
          {posts.map((post) => (
            <li key={post.slug}>
              <BlogPostCard post={post} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
