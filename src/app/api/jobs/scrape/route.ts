import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { VERCEL_ADAPTERS } from "@/lib/jobs/adapters";
import { ingestJobs, type IngestResult } from "@/lib/jobs/ingest";
import type { JobSource } from "@/lib/db/schema";

type SourceReport = {
  source: JobSource;
  ok: boolean;
  error?: string;
  result?: IngestResult;
};

async function isAuthorized(request: Request): Promise<boolean> {
  // 1) Manual trigger from the admin UI uses the session cookie.
  const cookie = (await cookies()).get("admin_session");
  if (cookie?.value === process.env.ADMIN_PASSWORD) return true;

  // 2) Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}` automatically
  //    when CRON_SECRET is configured as an env var.
  const auth = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  return false;
}

async function runScrape() {
  const reports: SourceReport[] = await Promise.all(
    VERCEL_ADAPTERS.map(async (adapter) => {
      try {
        const jobs = await adapter.fetch();
        const result = await ingestJobs(jobs);
        return { source: adapter.source, ok: true, result };
      } catch (e) {
        return {
          source: adapter.source,
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  const totals = reports.reduce(
    (acc, r) => {
      if (r.result) {
        acc.received += r.result.received;
        acc.inserted += r.result.inserted;
        acc.relevant += r.result.relevant;
        acc.rejected += r.result.rejected;
        acc.skipped += r.result.skipped;
        acc.tooOld += r.result.tooOld;
      }
      return acc;
    },
    { received: 0, relevant: 0, inserted: 0, skipped: 0, rejected: 0, tooOld: 0 },
  );

  return { totals, reports };
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runScrape());
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runScrape());
}

// Scrape several remote sources sequentially — give it room.
export const maxDuration = 60;
