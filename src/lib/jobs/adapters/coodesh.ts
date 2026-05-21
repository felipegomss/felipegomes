import { cleanHtml } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";
import { extractJobPostingLd, jobCompanyName, jobLocationToString } from "./jsonld";

const SITEMAP_URL = "https://coodesh.com/sitemaps/jobs.xml";
const HEADERS = {
  "User-Agent": "lfng-jobs-fetcher",
  Accept: "text/html, application/xml",
};
const MAX_JOBS = 60;
const CONCURRENCY = 8;

function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc>(https?:\/\/coodesh\.com\/jobs\/[^<]+)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) urls.push(match[1]);
  return urls;
}

async function fetchJob(url: string): Promise<ScrapedJob | null> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const ld = extractJobPostingLd(await res.text());
  if (!ld) return null;
  const company = jobCompanyName(ld);
  return {
    url,
    source: "coodesh",
    type: "job",
    title: ld.title ?? null,
    body: [ld.title, company, cleanHtml(ld.description ?? "")].filter(Boolean).join("\n\n"),
    company,
    location: jobLocationToString(ld),
    authorName: company,
    authorUrl: null,
    postedAt: ld.datePosted ? new Date(ld.datePosted) : null,
    raw: ld,
  };
}

export const coodeshAdapter: Adapter = {
  source: "coodesh",
  async fetch(): Promise<ScrapedJob[]> {
    const res = await fetch(SITEMAP_URL, { headers: HEADERS });
    if (!res.ok) throw new Error(`Coodesh sitemap ${res.status}`);
    const urls = extractSitemapUrls(await res.text()).slice(0, MAX_JOBS);
    if (urls.length === 0) return [];

    const jobs: ScrapedJob[] = [];
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = urls.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((u) => fetchJob(u).catch(() => null)));
      for (const r of results) if (r) jobs.push(r);
    }
    return jobs;
  },
};
