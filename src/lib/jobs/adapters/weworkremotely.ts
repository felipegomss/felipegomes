import { cleanHtml } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";

const FEED_URL = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

type RssItem = {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  region?: string;
};

function getTag(body: string, name: string): string {
  const cdata = new RegExp(`<${name}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${name}>`).exec(body);
  if (cdata) return cdata[1].trim();
  const plain = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(body);
  return plain ? plain[1].trim() : "";
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const body = match[1];
    items.push({
      title: getTag(body, "title"),
      description: getTag(body, "description"),
      link: getTag(body, "link"),
      pubDate: getTag(body, "pubDate") || undefined,
      region: getTag(body, "region") || undefined,
    });
  }
  return items;
}

/** WWR titles follow "Company: Position (Region)" — split on first ": ". */
function splitTitle(title: string): { company: string | null; position: string } {
  const idx = title.indexOf(": ");
  if (idx === -1) return { company: null, position: title };
  return {
    company: title.slice(0, idx).trim(),
    position: title.slice(idx + 2).trim(),
  };
}

export const wwrAdapter: Adapter = {
  source: "wwr",
  async fetch(): Promise<ScrapedJob[]> {
    const res = await fetch(FEED_URL, {
      headers: { "User-Agent": "lfng-jobs-fetcher" },
    });
    if (!res.ok) throw new Error(`WWR ${res.status}`);
    const xml = await res.text();
    const items = parseRss(xml);

    return items
      .filter((i) => i.link)
      .map<ScrapedJob>((i) => {
        const { company, position } = splitTitle(i.title);
        return {
          url: i.link,
          source: "wwr",
          type: "job",
          title: position,
          body: [position, company, cleanHtml(i.description)].filter(Boolean).join("\n\n"),
          company,
          location: i.region ?? "Remote",
          authorName: company,
          authorUrl: null,
          postedAt: i.pubDate ? new Date(i.pubDate) : null,
          raw: i,
        };
      });
  },
};
