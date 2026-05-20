import type { JobSource } from "@/lib/db/schema";
import { stripHtmlComments } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";

type GithubIssue = {
  number: number;
  html_url: string;
  title: string;
  body: string | null;
  created_at: string;
  user: { login: string; html_url: string } | null;
  pull_request?: unknown;
};

async function fetchRepoIssues(
  owner: string,
  repo: string,
  source: JobSource,
): Promise<ScrapedJob[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100&sort=created&direction=desc`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text().catch(() => "")}`);
  }

  const issues = (await res.json()) as GithubIssue[];

  return issues
    .filter((i) => !i.pull_request) // skip PRs (issues endpoint returns both)
    .map((i) => ({
      url: i.html_url,
      source,
      type: "post" as const,
      title: i.title,
      body: stripHtmlComments(i.body ?? ""),
      authorName: i.user?.login ?? null,
      authorUrl: i.user?.html_url ?? null,
      postedAt: new Date(i.created_at),
      raw: i,
    }));
}

export const githubFrontendBrAdapter: Adapter = {
  source: "github-frontendbr",
  fetch: () => fetchRepoIssues("frontendbr", "vagas", "github-frontendbr"),
};

export const githubBackendBrAdapter: Adapter = {
  source: "github-backendbr",
  fetch: () => fetchRepoIssues("backend-br", "vagas", "github-backendbr"),
};

export const githubReactBrasilAdapter: Adapter = {
  source: "github-react-brasil",
  fetch: () => fetchRepoIssues("react-brasil", "vagas", "github-react-brasil"),
};
