import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, jobPosts, JOB_STATUSES, JOB_SOURCES } from "@/lib/db/client";

export async function GET(request: Request) {
  const session = (await cookies()).get("admin_session");
  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const starredOnly = url.searchParams.get("starred") === "1";
  const q = url.searchParams.get("q");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const conditions: SQL[] = [];
  if (status && (JOB_STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(jobPosts.status, status));
  }
  if (source && (JOB_SOURCES as readonly string[]).includes(source)) {
    conditions.push(eq(jobPosts.source, source));
  }
  if (starredOnly) {
    conditions.push(eq(jobPosts.starred, true));
  }
  if (q) {
    const like = `%${q}%`;
    const searchCondition = or(ilike(jobPosts.title, like), ilike(jobPosts.body, like));
    if (searchCondition) conditions.push(searchCondition);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(jobPosts)
      .where(where)
      .orderBy(desc(jobPosts.postedAt), desc(jobPosts.scrapedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobPosts)
      .where(where),
  ]);

  return NextResponse.json({ data: rows, total: count, limit, offset });
}
