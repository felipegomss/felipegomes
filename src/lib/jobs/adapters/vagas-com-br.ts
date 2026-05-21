import { cleanHtml } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";
import { extractJobPostingLd, jobCompanyName, jobLocationToString } from "./jsonld";

const BASE = "https://www.vagas.com.br";
/** Listing pages we crawl — both overlap our React/Next.js filter. */
const LISTING_PATHS = ["/vagas-de-react", "/vagas-de-nextjs"];
const HEADERS = {
  "User-Agent": "lfng-jobs-fetcher",
  Accept: "text/html",
};
/** Cap per scrape to stay within Vercel's 60s budget. */
const MAX_JOBS = 60;
const CONCURRENCY = 8;

function extractListingUrls(html: string): string[] {
  const urls = new Set<string>();
  const re = /href="(\/vagas\/v\d+\/[^"#?]+)"/g;
  let match;
  while ((match = re.exec(html)) !== null) urls.add(`${BASE}${match[1]}`);
  return [...urls];
}

async function fetchListingUrls(): Promise<string[]> {
  const all = new Set<string>();
  for (const path of LISTING_PATHS) {
    try {
      const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
      if (!res.ok) continue;
      for (const url of extractListingUrls(await res.text())) all.add(url);
    } catch {
      // Skip individual listing failures — adapter-level failure only on a true outage.
    }
  }
  return [...all].slice(0, MAX_JOBS);
}

async function fetchJob(url: string): Promise<ScrapedJob | null> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const ld = extractJobPostingLd(await res.text());
  if (!ld) return null;
  const company = jobCompanyName(ld);
  return {
    url,
    source: "vagas-com-br",
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

export const vagasComBrAdapter: Adapter = {
  source: "vagas-com-br",
  async fetch(): Promise<ScrapedJob[]> {
    const urls = await fetchListingUrls();
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
