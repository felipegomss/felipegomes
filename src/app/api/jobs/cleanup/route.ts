import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, jobPosts } from "@/lib/db/client";

const NEW_AGE_DAYS = 30;
const DISMISSED_AGE_DAYS = 7;

async function isAuthorized(request: Request): Promise<boolean> {
  const cookie = (await cookies()).get("admin_session");
  if (cookie?.value === process.env.ADMIN_PASSWORD) return true;

  const auth = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

async function runCleanup() {
  // Delete 'new' jobs whose original posting date is too old.
  const expiredNew = await db
    .delete(jobPosts)
    .where(
      and(
        eq(jobPosts.status, "new"),
        eq(jobPosts.starred, false),
        lt(jobPosts.postedAt, sql`now() - make_interval(days => ${NEW_AGE_DAYS})`),
      ),
    )
    .returning({ id: jobPosts.id });

  // Delete 'dismissed' jobs after a shorter retention window (already triaged).
  const expiredDismissed = await db
    .delete(jobPosts)
    .where(
      and(
        eq(jobPosts.status, "dismissed"),
        eq(jobPosts.starred, false),
        lt(jobPosts.scrapedAt, sql`now() - make_interval(days => ${DISMISSED_AGE_DAYS})`),
      ),
    )
    .returning({ id: jobPosts.id });

  return {
    deleted: {
      newExpired: expiredNew.length,
      dismissed: expiredDismissed.length,
      total: expiredNew.length + expiredDismissed.length,
    },
    policy: {
      newAgeDays: NEW_AGE_DAYS,
      dismissedAgeDays: DISMISSED_AGE_DAYS,
      preserves: ["starred = true", "status = 'contacted'"],
    },
  };
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runCleanup());
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runCleanup());
}
