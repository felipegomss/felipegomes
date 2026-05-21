/**
 * Helpers to extract schema.org `JobPosting` JSON-LD from HTML pages.
 * Used by adapters that scrape sites which publish structured data —
 * cleaner and more stable than parsing arbitrary HTML.
 */

type Address = {
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
};

type JobLocationLd = { address?: Address };

export type JobPostingLd = {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string;
  hiringOrganization?: { name?: string } | { name?: string }[];
  jobLocation?: JobLocationLd | JobLocationLd[];
  jobLocationType?: string | string[];
  identifier?: { value?: string | number };
};

const SCRIPT_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Returns the first `JobPosting` found across all JSON-LD blocks on the page.
 * Handles both single-object and `@graph` array forms.
 */
export function extractJobPostingLd(html: string): JobPostingLd | null {
  const matches = html.matchAll(SCRIPT_RE);
  for (const m of matches) {
    const raw = m[1].trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const found = findJobPosting(parsed);
    if (found) return found;
  }
  return null;
}

function findJobPosting(node: unknown): JobPostingLd | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  if (matchesType(obj["@type"], "JobPosting")) return obj as JobPostingLd;
  const graph = obj["@graph"];
  if (Array.isArray(graph)) {
    for (const child of graph) {
      const found = findJobPosting(child);
      if (found) return found;
    }
  }
  return null;
}

function matchesType(type: unknown, target: string): boolean {
  if (typeof type === "string") return type === target;
  if (Array.isArray(type)) return type.includes(target);
  return false;
}

export function jobCompanyName(ld: JobPostingLd): string | null {
  const org = Array.isArray(ld.hiringOrganization) ? ld.hiringOrganization[0] : ld.hiringOrganization;
  return org?.name?.trim() || null;
}

export function jobLocationToString(ld: JobPostingLd): string | null {
  const locs = Array.isArray(ld.jobLocation)
    ? ld.jobLocation
    : ld.jobLocation
      ? [ld.jobLocation]
      : [];
  const parts = locs
    .map((loc) => {
      const a = loc.address;
      if (!a) return "";
      return [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(", ");
    })
    .filter((s) => s.length > 0);
  if (parts.length > 0) return parts.join(" | ");
  const type = Array.isArray(ld.jobLocationType) ? ld.jobLocationType[0] : ld.jobLocationType;
  return type === "TELECOMMUTE" ? "Remote" : null;
}
