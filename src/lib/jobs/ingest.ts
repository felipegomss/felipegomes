import { db, jobPosts, type NewJobPost } from "@/lib/db/client";
import { extractContacts } from "./extract-contacts";
import { matchKeywords } from "./keywords";
import type { ScrapedJob } from "./types";

export type IngestStats = {
  received: number;
  relevant: number;
  inserted: number;
  skipped: number;
  rejected: number;
  tooOld: number;
};

export type IngestResult = IngestStats & {
  insertedUrls: string[];
};

const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Filters scraped jobs by keyword relevance, extracts contacts, then
 * batch-inserts with ON CONFLICT (url) DO NOTHING.
 *
 * Returns per-batch stats.
 */
export async function ingestJobs(jobs: ScrapedJob[]): Promise<IngestResult> {
  const stats: IngestStats = {
    received: jobs.length,
    relevant: 0,
    inserted: 0,
    skipped: 0,
    rejected: 0,
    tooOld: 0,
  };
  const insertedUrls: string[] = [];

  if (jobs.length === 0) return { ...stats, insertedUrls };

  const cutoff = Date.now() - MAX_AGE_MS;

  const rows: NewJobPost[] = [];
  for (const job of jobs) {
    // Filter by age — only jobs posted within the last 30 days.
    // If postedAt is unknown, keep the job (better safe than skipping silently).
    if (job.postedAt && job.postedAt.getTime() < cutoff) {
      stats.tooOld += 1;
      continue;
    }

    const searchText = `${job.title ?? ""}\n${job.body}`;
    const { matched, rejected, hasReactStack } = matchKeywords(searchText);
    if (!hasReactStack || rejected.length > 0) {
      stats.rejected += 1;
      continue;
    }
    stats.relevant += 1;
    const { emails, whatsapps } = extractContacts(job.body);
    rows.push({
      url: job.url,
      source: job.source,
      type: job.type,
      title: job.title ?? null,
      body: job.body,
      company: job.company ?? null,
      location: job.location ?? null,
      authorName: job.authorName ?? null,
      authorUrl: job.authorUrl ?? null,
      postedAt: job.postedAt ?? null,
      matchedKeywords: matched,
      contactEmails: emails,
      contactWhatsapps: whatsapps,
      raw: job.raw ?? null,
    });
  }

  if (rows.length === 0) return { ...stats, insertedUrls };

  // Batch in chunks of 100 to avoid huge query payloads.
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const inserted = await db
      .insert(jobPosts)
      .values(batch)
      .onConflictDoNothing({ target: jobPosts.url })
      .returning({ url: jobPosts.url });
    insertedUrls.push(...inserted.map((r) => r.url));
  }

  stats.inserted = insertedUrls.length;
  stats.skipped = rows.length - insertedUrls.length;
  return { ...stats, insertedUrls };
}
