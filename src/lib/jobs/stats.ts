import { desc, eq, max, sql } from "drizzle-orm";
import { db, jobPosts, JOB_STATUSES, JOB_SOURCES, type JobStatus, type JobSource } from "@/lib/db/client";

export type JobStats = {
  total: number;
  byStatus: Record<JobStatus, number>;
  starred: number;
  bySource: { source: JobSource; count: number }[];
  /** Matrix: per source × status (contacted | dismissed) + starred. */
  bySourceBreakdown: {
    source: JobSource;
    total: number;
    new: number;
    contacted: number;
    dismissed: number;
    starred: number;
  }[];
  lastScrapedAt: Date | null;
  lastPostedAt: Date | null;
};

export async function getJobStats(): Promise<JobStats> {
  const [statusRows, sourceRows, breakdownRows, [starredRow], [meta]] = await Promise.all([
    db
      .select({ status: jobPosts.status, count: sql<number>`count(*)::int` })
      .from(jobPosts)
      .groupBy(jobPosts.status),
    db
      .select({ source: jobPosts.source, count: sql<number>`count(*)::int` })
      .from(jobPosts)
      .groupBy(jobPosts.source)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        source: jobPosts.source,
        total: sql<number>`count(*)::int`,
        new: sql<number>`count(*) filter (where status = 'new')::int`,
        contacted: sql<number>`count(*) filter (where status = 'contacted')::int`,
        dismissed: sql<number>`count(*) filter (where status = 'dismissed')::int`,
        starred: sql<number>`count(*) filter (where starred = true)::int`,
      })
      .from(jobPosts)
      .groupBy(jobPosts.source)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobPosts)
      .where(eq(jobPosts.starred, true)),
    db
      .select({
        lastScrapedAt: max(jobPosts.scrapedAt),
        lastPostedAt: max(jobPosts.postedAt),
        total: sql<number>`count(*)::int`,
      })
      .from(jobPosts),
  ]);

  const byStatus = Object.fromEntries(
    JOB_STATUSES.map((s) => [s, 0]),
  ) as Record<JobStatus, number>;
  for (const r of statusRows) {
    if ((JOB_STATUSES as readonly string[]).includes(r.status)) {
      byStatus[r.status as JobStatus] = r.count;
    }
  }

  const bySource = sourceRows
    .filter((r): r is { source: JobSource; count: number } =>
      (JOB_SOURCES as readonly string[]).includes(r.source),
    )
    .map((r) => ({ source: r.source as JobSource, count: r.count }));

  const bySourceBreakdown = breakdownRows
    .filter((r) => (JOB_SOURCES as readonly string[]).includes(r.source))
    .map((r) => ({
      source: r.source as JobSource,
      total: r.total,
      new: r.new,
      contacted: r.contacted,
      dismissed: r.dismissed,
      starred: r.starred,
    }));

  return {
    total: meta.total ?? 0,
    byStatus,
    starred: starredRow.count,
    bySource,
    bySourceBreakdown,
    lastScrapedAt: meta.lastScrapedAt,
    lastPostedAt: meta.lastPostedAt,
  };
}
