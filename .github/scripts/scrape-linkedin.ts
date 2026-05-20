/**
 * LinkedIn Jobs scraper — runs on GitHub Actions (different IP pool from Vercel).
 * Reads `LI_AT_COOKIE`, scrapes structured job listings, POSTs to /api/jobs/ingest.
 *
 * Env required:
 *   - LI_AT_COOKIE     (your linkedin.com session cookie, value of `li_at`)
 *   - INGEST_URL       (e.g. https://lfng.dev)
 *   - INGEST_SECRET    (shared secret with the ingest endpoint)
 */
import {
  LinkedinScraper,
  events,
  timeFilter,
  onSiteOrRemoteFilter,
} from "linkedin-jobs-scraper";

type ScrapedJob = {
  url: string;
  source: "linkedin-jobs";
  type: "job";
  title: string | null;
  body: string;
  company: string | null;
  location: string | null;
  authorName: string | null;
  authorUrl: string | null;
  postedAt: string | null;
  raw: unknown;
};

const QUERIES = [
  { query: "fullstack react node", locations: ["Brasil", "Remote"] },
  { query: "senior frontend next.js", locations: ["Brasil", "Remote"] },
  { query: "pleno fullstack typescript", locations: ["Brasil"] },
];

const PER_QUERY_LIMIT = 50;

async function main() {
  const liAt = process.env.LI_AT_COOKIE;
  const ingestUrl = process.env.INGEST_URL;
  const ingestSecret = process.env.INGEST_SECRET;

  if (!liAt) throw new Error("LI_AT_COOKIE não definida.");
  if (!ingestUrl) throw new Error("INGEST_URL não definida.");
  if (!ingestSecret) throw new Error("INGEST_SECRET não definida.");

  // The library reads LI_AT_COOKIE from env automatically. Ensure it's set on process.env
  // (already true if passed via GHA `env:`), but make explicit for clarity.
  process.env.LI_AT_COOKIE = liAt;

  const scraper = new LinkedinScraper({
    headless: true,
    slowMo: 250,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const collected: ScrapedJob[] = [];

  scraper.on(events.scraper.data, (data: Record<string, unknown>) => {
    const link = (data.link ?? data.jobLink) as string | undefined;
    if (!link) return;
    collected.push({
      url: link,
      source: "linkedin-jobs",
      type: "job",
      title: (data.title as string) ?? null,
      body:
        (data.description as string) ??
        (data.descriptionHTML as string) ??
        "",
      company: (data.company as string) ?? null,
      location: (data.place as string) ?? (data.location as string) ?? null,
      authorName: (data.company as string) ?? null,
      authorUrl: (data.companyLink as string) ?? null,
      postedAt: data.date
        ? new Date(data.date as string).toISOString()
        : null,
      raw: data,
    });
  });

  scraper.on(events.scraper.error, (err: unknown) => {
    console.error("[scraper error]", err);
  });

  scraper.on(events.scraper.end, () => {
    console.log(`[scraper end] coletados: ${collected.length}`);
  });

  for (const q of QUERIES) {
    console.log(`[query] "${q.query}" em ${q.locations.join(", ")}`);
    await scraper.run([
      {
        query: q.query,
        options: {
          locations: q.locations,
          limit: PER_QUERY_LIMIT,
          filters: {
            time: timeFilter.MONTH,
            onSiteOrRemote: [onSiteOrRemoteFilter.REMOTE],
          },
        },
      },
    ]);
  }

  await scraper.close();

  console.log(`[ingest] enviando ${collected.length} jobs pra ${ingestUrl}`);
  const res = await fetch(`${ingestUrl}/api/jobs/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ingestSecret}`,
    },
    body: JSON.stringify({ jobs: collected }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ingest falhou ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log("[ingest result]", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
