import { NextResponse } from "next/server";
import { JOB_SOURCES, JOB_TYPES } from "@/lib/db/schema";
import { ingestJobs } from "@/lib/jobs/ingest";
import type { ScrapedJob } from "@/lib/jobs/types";

function validate(body: unknown): ScrapedJob[] | null {
  if (!body || typeof body !== "object") return null;
  const jobs = (body as { jobs?: unknown }).jobs;
  if (!Array.isArray(jobs)) return null;

  const out: ScrapedJob[] = [];
  for (const j of jobs) {
    if (!j || typeof j !== "object") return null;
    const candidate = j as Record<string, unknown>;
    if (typeof candidate.url !== "string" || candidate.url.length === 0) return null;
    if (typeof candidate.body !== "string") return null;
    if (typeof candidate.source !== "string" || !JOB_SOURCES.includes(candidate.source as never))
      return null;
    if (typeof candidate.type !== "string" || !JOB_TYPES.includes(candidate.type as never))
      return null;

    out.push({
      url: candidate.url,
      source: candidate.source as ScrapedJob["source"],
      type: candidate.type as ScrapedJob["type"],
      title: (candidate.title as string | null | undefined) ?? null,
      body: candidate.body,
      company: (candidate.company as string | null | undefined) ?? null,
      location: (candidate.location as string | null | undefined) ?? null,
      authorName: (candidate.authorName as string | null | undefined) ?? null,
      authorUrl: (candidate.authorUrl as string | null | undefined) ?? null,
      postedAt: candidate.postedAt ? new Date(candidate.postedAt as string) : null,
      raw: candidate.raw,
    });
  }
  return out;
}

export async function POST(request: Request) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INGEST_SECRET não configurada." }, { status: 500 });
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const jobs = validate(body);
  if (jobs === null) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const result = await ingestJobs(jobs);
  return NextResponse.json(result);
}
