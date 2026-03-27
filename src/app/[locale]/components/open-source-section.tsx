import { getTranslations } from "next-intl/server";
import { IconAbstract } from "nucleo-isometric";
import { cache } from "react";
import { SectionHeading } from "./section-heading";

const GITHUB_USERNAME = "felipegomss";
const MAX_VISIBLE_IDS = 5;
const IGNORED_OWNERS = ["ICEI-PUC-Minas-PMV-ADS"];

type GitHubSearchItem = {
  number: number;
  repository_url: string;
};

type GitHubSearchResponse = {
  items?: GitHubSearchItem[];
};

type GitHubRepo = {
  description?: string;
};

interface OSSRepo {
  name: string;
  description: string;
  numbers: number[];
  count: number;
  url: string;
}

interface OpenSourceItemProps {
  repo: OSSRepo;
}

const FETCH_TIMEOUT = 5000;

async function githubFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

const getOSSContributions = cache(async (): Promise<OSSRepo[]> => {
  const [prsData, issuesData] = await Promise.allSettled([
    githubFetch<GitHubSearchResponse>(
      `https://api.github.com/search/issues?q=author:${GITHUB_USERNAME}+is:pr+is:merged+-user:${GITHUB_USERNAME}&sort=created&order=desc&per_page=100`,
    ),
    githubFetch<GitHubSearchResponse>(
      `https://api.github.com/search/issues?q=author:${GITHUB_USERNAME}+is:issue+-user:${GITHUB_USERNAME}&sort=created&order=desc&per_page=100`,
    ),
  ]);

  const prsItems =
    prsData.status === "fulfilled" ? (prsData.value?.items ?? []) : [];
  const issuesItems =
    issuesData.status === "fulfilled" ? (issuesData.value?.items ?? []) : [];

  const allItems = [...prsItems, ...issuesItems];
  if (allItems.length === 0) return [];

  const repoMap = new Map<
    string,
    { numbers: Set<number>; repoApiUrl: string }
  >();

  for (const item of allItems) {
    const repoApiUrl = item.repository_url;
    const repoName = repoApiUrl.replace("https://api.github.com/repos/", "");

    const owner = repoName.split("/")[0];
    if (IGNORED_OWNERS.includes(owner)) continue;

    const entry = repoMap.get(repoName);
    if (entry) {
      entry.numbers.add(item.number);
    } else {
      repoMap.set(repoName, {
        numbers: new Set([item.number]),
        repoApiUrl,
      });
    }
  }

  const results = await Promise.allSettled(
    Array.from(repoMap.entries()).map(
      async ([fullName, { numbers, repoApiUrl }]) => {
        const data = await githubFetch<GitHubRepo>(repoApiUrl);
        const sorted = Array.from(numbers).toSorted((a, b) => b - a);

        return {
          name: fullName,
          description: data?.description ?? "",
          numbers: sorted.slice(0, MAX_VISIBLE_IDS),
          count: sorted.length,
          url: `https://github.com/${fullName}/issues?q=author%3A${GITHUB_USERNAME}`,
        };
      },
    ),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<OSSRepo> => r.status === "fulfilled",
    )
    .map((r) => r.value)
    .toSorted((a, b) => b.count - a.count);
});

function OpenSourceItem({ repo }: OpenSourceItemProps) {
  return (
    <li>
      <a
        href={repo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <p className="external-link text-sm group-hover:decoration-foreground group-hover:text-foreground">
          <span className="font-bold">{repo.name}</span>
          <span className="ml-1.5 text-xs text-muted-foreground-subtle">
            {repo.numbers.map((n) => `#${n}`).join(" ")}
            {repo.count > MAX_VISIBLE_IDS &&
              ` +${repo.count - MAX_VISIBLE_IDS}`}
          </span>
        </p>
        {repo.description && (
          <blockquote className="mt-0.5 text-xs italic text-muted-foreground">
            &ldquo;{repo.description}&rdquo;
          </blockquote>
        )}
        <span className="sr-only">(opens in new tab)</span>
      </a>
    </li>
  );
}

export async function OpenSourceSection() {
  const t = await getTranslations("openSource");
  const repos = await getOSSContributions();

  if (repos.length === 0) return null;

  return (
    <section
      aria-label="Open Source Contributions"
      className="border-b border-border p-6"
    >
      <SectionHeading icon={<IconAbstract size={14} aria-hidden="true" />}>
        {t("title")}
      </SectionHeading>
      <ul className="space-y-3">
        {repos.map((repo) => (
          <OpenSourceItem key={repo.name} repo={repo} />
        ))}
      </ul>
    </section>
  );
}
