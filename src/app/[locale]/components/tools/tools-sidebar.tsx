"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { tools, groupByCategory } from "@/lib/tools";

export function ToolsSidebar() {
  const t = useTranslations("tools");
  const locale = useLocale();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const activeSlug = pathname.startsWith("/tools/")
    ? pathname.slice("/tools/".length)
    : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((tool) => {
      const title = t(tool.titleKey).toLowerCase();
      const category = t(`categories.${tool.category}`).toLowerCase();
      const keywords = (tool.keywords ?? []).join(" ").toLowerCase();
      return (
        title.includes(q) ||
        category.includes(q) ||
        keywords.includes(q) ||
        tool.slug.includes(q)
      );
    });
  }, [query, t]);

  const groups = groupByCategory(filtered);

  return (
    <nav aria-label={t("title")} className="space-y-4">
      <div className="relative">
        <Search
          size={12}
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground-subtle"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-8 w-full border border-border bg-transparent pl-7 pr-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
        />
      </div>

      {groups.length === 0 ? (
        <p className="text-2xs text-muted-foreground-subtle">{t("noResults")}</p>
      ) : (
        <ul className="space-y-5">
          {groups.map((group) => (
            <li key={group.category}>
              <h3 className="mb-2 text-2xs font-bold uppercase tracking-widest text-muted-foreground-subtle">
                {t(`categories.${group.category}`)}
              </h3>
              <ul className="space-y-px">
                {group.items.map((tool) => {
                  const active = tool.slug === activeSlug;
                  return (
                    <li key={tool.slug}>
                      <Link
                        href={`/${locale}/tools/${tool.slug}`}
                        aria-current={active ? "page" : undefined}
                        className={`block border-l-2 px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-foreground bg-muted/60 text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {t(tool.titleKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
