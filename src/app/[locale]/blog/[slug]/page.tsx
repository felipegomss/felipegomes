import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { routing } from "@/i18n/routing";
import { BASE_URL, contact } from "@/lib/constants";
import { getAllPosts, getPostBySlug, formatDate } from "@/lib/blog";
import { mdxComponents } from "../../components/mdx-content";
import { TableOfContents } from "../../components/table-of-contents";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.flatMap((post) =>
    routing.locales.map((locale) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const result = await getPostBySlug(slug);
  if (!result) return {};

  const { post } = result;
  const url = `${BASE_URL}/${locale}/blog/${slug}`;

  return {
    title: `${post.title} — LFNG`,
    description: post.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`]),
        ),
        "x-default": `${BASE_URL}/pt-BR/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      tags: post.tags,
      siteName: "LFNG",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await getPostBySlug(slug);
  if (!result) notFound();

  const { post, source } = result;
  const t = await getTranslations({ locale, namespace: "blog" });

  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: {
                dark: "github-dark-dimmed",
                light: "github-light",
              },
              keepBackground: false,
            },
          ],
        ],
      },
    },
    components: mdxComponents,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: locale,
    keywords: post.tags.join(", "),
    url: `${BASE_URL}/${locale}/blog/${slug}`,
    author: {
      "@type": "Person",
      name: contact.name,
      url: `${BASE_URL}/${locale}`,
    },
    publisher: {
      "@type": "Person",
      name: contact.name,
      url: BASE_URL,
    },
  };

  return (
    <main
      id="main-content"
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-8">
        <Link
          href={`/${locale}/blog`}
          className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("backToBlog")}
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-16">
        <div className="min-w-0">
          <header className="mb-8 border-b border-border pb-6">
            <h1 className="font-heading text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {post.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-muted-foreground-subtle">
              <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
              <span aria-hidden="true">·</span>
              <span>
                {t("readingTime", { minutes: post.readingTimeMinutes })}
              </span>
              {post.tags.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <ul
                    className="flex flex-wrap gap-1.5"
                    role="list"
                    aria-label="Tags"
                  >
                    {post.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-sm border border-border px-1.5 py-0.5"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </header>

          <article className="prose prose-neutral max-w-none dark:prose-invert">
            {content}
          </article>

          <footer className="mt-12 border-t border-border pt-6">
            <Link
              href={`/${locale}/blog`}
              className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("backToBlog")}
            </Link>
          </footer>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <TableOfContents
              headings={post.headings}
              label={t("tableOfContents")}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
