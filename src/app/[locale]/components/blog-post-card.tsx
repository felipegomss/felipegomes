import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Post } from "@/lib/blog";
import { formatDate } from "@/lib/blog";

interface BlogPostCardProps {
  post: Post;
  locale: string;
}

export async function BlogPostCard({ post, locale }: BlogPostCardProps) {
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <Link
      href={`/${locale}/blog/${post.slug}`}
      className="-mx-4 block rounded-lg px-4 py-6 transition-colors hover:bg-muted/40"
    >
      <article>
        <h2 className="font-heading text-sm font-black tracking-tight">
          {post.title}
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {post.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-muted-foreground-subtle">
          <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
          <span aria-hidden="true">·</span>
          <span>{t("readingTime", { minutes: post.readingTimeMinutes })}</span>
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
      </article>
    </Link>
  );
}
