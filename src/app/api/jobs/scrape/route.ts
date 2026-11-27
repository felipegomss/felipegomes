import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { runScrape } from "@/lib/jobs/scrape";

async function isAuthorized(request: Request): Promise<boolean> {
  // 1) Manual trigger from the admin UI uses the session cookie.
  if (await isAdmin()) return true;

  // 2) Vercel Cron sets `Authorization: Bearer ${CRON_SECRET}` automatically
  //    when CRON_SECRET is configured as an env var.
  const auth = request.headers.get("authorization") ?? "";
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  return false;
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
