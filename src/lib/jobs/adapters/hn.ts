import { cleanHtml } from "../clean-html";
import type { Adapter, ScrapedJob } from "../types";

type HnStorySearchHit = { objectID: string; title: string; created_at_i: number };
type HnSearchResponse = { hits: HnStorySearchHit[] };

type HnItem = {
  id: number;
  by?: string;
  text?: string;
  time?: number;
  kids?: number[];
};

const HN_API = "https://hacker-news.firebaseio.com/v0";
const HN_SEARCH = "https://hn.algolia.com/api/v1";

/** First line of a HN "Who is hiring?" comment is usually "Company | Role | Location | etc." */
function firstLine(text: string): string {
  return text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
}

const MAX_COMMENTS = 200;

export const hnHiringAdapter: Adapter = {
  source: "hn-hiring",
  async fetch(): Promise<ScrapedJob[]> {
    // 1. Find the latest "Ask HN: Who is hiring?" thread.
    const searchRes = await fetch(
      `${HN_SEARCH}/search_by_date?query=${encodeURIComponent("Ask HN: Who is hiring?")}&tags=story,author_whoishiring&hitsPerPage=1`,
    );
    if (!searchRes.ok) throw new Error(`HN search ${searchRes.status}`);
    const search = (await searchRes.json()) as HnSearchResponse;
    const story = search.hits[0];
    if (!story) return [];

    // 2. Fetch the story to get top-level kids (job posts).
    const storyRes = await fetch(`${HN_API}/item/${story.objectID}.json`);
    if (!storyRes.ok) throw new Error(`HN story ${storyRes.status}`);
    const storyItem = (await storyRes.json()) as HnItem;
    const kids = (storyItem.kids ?? []).slice(0, MAX_COMMENTS);

    // 3. Fetch each kid in parallel batches.
    const items: HnItem[] = [];
    const BATCH = 20;
    for (let i = 0; i < kids.length; i += BATCH) {
      const batch = kids.slice(i, i + BATCH);
      const fetched = await Promise.all(
        batch.map((id) =>
          fetch(`${HN_API}/item/${id}.json`)
            .then((r) => (r.ok ? (r.json() as Promise<HnItem>) : null))
            .catch(() => null),
        ),
      );
      items.push(...fetched.filter((x): x is HnItem => x !== null && !!x.text));
    }

    return items.map<ScrapedJob>((item) => {
      const body = cleanHtml(item.text ?? "");
      return {
        url: `https://news.ycombinator.com/item?id=${item.id}`,
        source: "hn-hiring",
        type: "post",
        title: firstLine(body).slice(0, 180),
        body,
        company: null,
        location: null,
        authorName: item.by ?? null,
        authorUrl: item.by ? `https://news.ycombinator.com/user?id=${item.by}` : null,
        postedAt: item.time ? new Date(item.time * 1000) : null,
        raw: item,
      };
    });
  },
};
