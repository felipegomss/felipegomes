import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { getAllPosts, formatDate } from "@/lib/blog";
import { GridCell } from "./grid-cell";
import { SectionHeading } from "./section-heading";

export async function RecentPostsSection() {
  const locale = await getLocale();
  const [t, allPosts] = await Promise.all([
    getTranslations("blog"),
    getAllPosts(locale),
  ]);

  if (allPosts.length === 0) return null;

  const posts = allPosts.slice(0, 3);
  const hasMore = allPosts.length > 3;

  return (
    <GridCell col="right" className="p-6">
      <SectionHeading icon={<BookOpen size={14} aria-hidden="true" />}>
        {t("recentPosts")}
      </SectionHeading>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="group block"
            >
              <p className="text-sm leading-snug transition-colors group-hover:text-muted-foreground">
                {post.title}
              </p>
              <p className="mt-0.5 text-2xs text-muted-foreground-subtle">
                {formatDate(post.date, locale)}
                {" · "}
                {t("readingTime", { minutes: post.readingTimeMinutes })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Link
          href={`/${locale}/blog`}
          className="mt-4 block text-2xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("viewAll")}
        </Link>
      )}
    </GridCell>
  );
}
