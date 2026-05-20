import type { JobSource, JobType } from "@/lib/db/schema";

/** Shape produced by adapters, fed into the ingest pipeline. */
export type ScrapedJob = {
  url: string;
  source: JobSource;
  type: JobType;
  title?: string | null;
  body: string;
  company?: string | null;
  location?: string | null;
  authorName?: string | null;
  authorUrl?: string | null;
  postedAt?: Date | null;
  raw?: unknown;
};

export type AdapterResult = {
  source: JobSource;
  jobs: ScrapedJob[];
  errors: string[];
};

export type Adapter = {
  source: JobSource;
  fetch: () => Promise<ScrapedJob[]>;
};
