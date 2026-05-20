import { cleanHtml } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";

type RemoteOkJob = {
  id: string;
  slug?: string;
  url: string;
  position?: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
  date?: string;
  epoch?: number;
};

type RemoteOkPayload = (Record<string, unknown> | RemoteOkJob)[];

function isJob(item: Record<string, unknown> | RemoteOkJob): item is RemoteOkJob {
  return typeof (item as RemoteOkJob).id !== "undefined" && typeof (item as RemoteOkJob).url === "string";
}

export const remoteOkAdapter: Adapter = {
  source: "remoteok",
  async fetch(): Promise<ScrapedJob[]> {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "lfng-jobs-fetcher" },
    });
    if (!res.ok) {
      throw new Error(`RemoteOK ${res.status}`);
    }
    const payload = (await res.json()) as RemoteOkPayload;

    return payload
      .filter(isJob)
      .map<ScrapedJob>((job) => ({
        url: job.url,
        source: "remoteok",
        type: "job",
        title: job.position ?? null,
        // Tags são SEO-spam no RemoteOK (uma vaga "Senior CRO Manager" tem
        // "react" como tag só pra aparecer em busca). Mantemos no `raw` mas
        // não no body — o match precisa estar na descrição de verdade.
        body: [job.position, job.company, cleanHtml(job.description)]
          .filter(Boolean)
          .join("\n\n"),
        company: job.company ?? null,
        location: job.location ?? "Remote",
        authorName: job.company ?? null,
        authorUrl: null,
        postedAt: job.epoch ? new Date(job.epoch * 1000) : job.date ? new Date(job.date) : null,
        raw: job,
      }));
  },
};
