// Busca de vagas nas fontes públicas (usada pelo cron, pelo app e pelo MCP).
import { VERCEL_ADAPTERS } from "@/lib/jobs/adapters";
import { ingestJobs, type IngestResult } from "@/lib/jobs/ingest";
import type { JobSource } from "@/lib/db/schema";

export type SourceReport = {
  source: JobSource;
  ok: boolean;
  error?: string;
  result?: IngestResult;
};

export async function runScrape() {
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
