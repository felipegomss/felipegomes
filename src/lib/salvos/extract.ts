// Lê um link e devolve o que dá para guardar: título, autor, miniatura e o
// texto (legenda, descrição, texto da página, receita estruturada).
// Redes sociais pelo oEmbed público de cada uma; Instagram pelo oEmbed da Meta
// (precisa de token de app); sites pelo HTML.
import { getMetaToken } from "@/lib/settings";
import type { Platform } from "./platforms";

export { PLATFORM_LABELS, PLATFORMS, type Platform } from "./platforms";

export type Extracted = {
  url: string;
  platform: Platform;
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
  content: string;
  /** Avisos que não impedem salvar (ex.: Instagram sem token). */
  warning?: string;
};

const MAX_CONTENT = 20_000;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// ── URL ─────────────────────────────────────────────────────────────────────

const TRACKING = /^(utm_\w+|igsh|igshid|si|feature|is_from_webapp|sender_device|_r|_t|ref|ref_src|ref_url|fbclid|gclid|mibextid)$/i;

/** Normaliza: https, sem fragmento e sem parâmetros de rastreio. null se não for um link http(s). */
export function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  const found = s.match(/https?:\/\/\S+/i);
  if (found) s = found[0];
  else if (/^[\w-]+(\.[\w-]+)+\//.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k) || (k === "s" && /(^|\.)(x|twitter)\.com$/.test(u.hostname))) u.searchParams.delete(k);
  u.hostname = u.hostname.toLowerCase();
  return u.toString().replace(/\?$/, "");
}

export function detectPlatform(url: string): Platform {
  const h = new URL(url).hostname.replace(/^(www|m|mobile|vm|vt)\./, "");
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "instagram.com" || h === "instagr.am") return "instagram";
  if (h === "x.com" || h === "twitter.com") return "x";
  if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com")) return "youtube";
  return "web";
}

/** Não deixa buscar endereços internos (proteção contra SSRF). */
function isPublicHost(url: string): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const h = new URL(url).hostname;
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (h.includes(":")) return false; // IPv6 literal
  return true;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

async function get(url: string, opts: { accept?: string; maxBytes?: number } = {}): Promise<{ url: string; status: number; text: string } | null> {
  if (!isPublicHost(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: opts.accept ?? "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8", "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const reader = res.body?.getReader();
    let text = "";
    if (reader) {
      const dec = new TextDecoder();
      let size = 0;
      const max = opts.maxBytes ?? 1_500_000;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        text += dec.decode(value, { stream: true });
        if (size > max) {
          await reader.cancel();
          break;
        }
      }
    }
    return { url: res.url || url, status: res.status, text };
  } catch {
    return null;
  }
}

async function getJson<T>(url: string): Promise<T | null> {
  const r = await get(url, { accept: "application/json" });
  if (!r || r.status >= 400) return null;
  try {
    return JSON.parse(r.text) as T;
  } catch {
    return null;
  }
}

// ── HTML → texto ────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…", laquo: "«", raquo: "»" };
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

const clean = (s: string) =>
  decodeEntities(s)
    .replace(/[ \t\f\v\r]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

function htmlToText(html: string): string {
  return clean(
    html
      .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function meta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? clean(content) : null;
}

/** Receita em JSON-LD (schema.org/Recipe), comum em sites de receita. */
function recipeFromJsonLd(html: string): string | null {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const nodes: unknown[] = [];
    const walk = (n: unknown) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") {
        nodes.push(n);
        const g = (n as { "@graph"?: unknown })["@graph"];
        if (g) walk(g);
      }
    };
    walk(data);
    const recipe = nodes.find((n) => {
      const t = (n as { "@type"?: unknown })["@type"];
      return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
    }) as Record<string, unknown> | undefined;
    if (!recipe) continue;
    const text = (v: unknown): string[] =>
      Array.isArray(v) ? v.flatMap(text) : typeof v === "string" ? [v] : v && typeof v === "object" ? text((v as { text?: unknown; itemListElement?: unknown }).text ?? (v as { itemListElement?: unknown }).itemListElement) : [];
    const parts = [
      typeof recipe.name === "string" ? `Receita: ${recipe.name}` : null,
      recipe.recipeYield ? `Rende: ${text(recipe.recipeYield).join(", ")}` : null,
      recipe.recipeIngredient ? `Ingredientes:\n${text(recipe.recipeIngredient).map((i) => `- ${clean(i)}`).join("\n")}` : null,
      recipe.recipeInstructions ? `Modo de preparo:\n${text(recipe.recipeInstructions).map((s, i) => `${i + 1}. ${clean(s)}`).join("\n")}` : null,
    ].filter(Boolean);
    if (parts.length) return parts.join("\n\n");
  }
  return null;
}

function pageExtract(url: string, html: string): Omit<Extracted, "platform"> {
  const main = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
  const title = meta(html, "og:title") ?? (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]) : null);
  const description = meta(html, "og:description") ?? meta(html, "description");
  const recipe = recipeFromJsonLd(html);
  const body = htmlToText(main);
  const content = [description, recipe, body].filter(Boolean).join("\n\n");
  return {
    url,
    title,
    author: meta(html, "author") ?? meta(html, "article:author") ?? meta(html, "og:site_name"),
    thumbnailUrl: meta(html, "og:image"),
    content,
  };
}

// ── Plataformas ─────────────────────────────────────────────────────────────

type OEmbed = { title?: string; author_name?: string; author_url?: string; thumbnail_url?: string; html?: string };

async function tiktok(url: string): Promise<Partial<Extracted>> {
  const o = await getJson<OEmbed>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  if (!o) return {};
  return { title: o.title ?? null, author: o.author_name ? `@${o.author_url?.split("@")[1] ?? o.author_name}` : null, thumbnailUrl: o.thumbnail_url ?? null, content: o.title ?? "" };
}

async function youtube(url: string): Promise<Partial<Extracted>> {
  const [o, page] = await Promise.all([getJson<OEmbed>(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`), get(url)]);
  // A descrição completa vem no JSON da página ("shortDescription").
  const raw = page?.text.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1];
  let description: string | null = null;
  if (raw) {
    try {
      description = JSON.parse(`"${raw}"`) as string;
    } catch {
      description = null;
    }
  }
  description ??= page ? meta(page.text, "og:description") : null;
  return {
    title: o?.title ?? null,
    author: o?.author_name ?? null,
    thumbnailUrl: o?.thumbnail_url ?? null,
    content: [o?.title, description].filter(Boolean).join("\n\n"),
  };
}

async function x(url: string): Promise<Partial<Extracted>> {
  const o = await getJson<OEmbed>(`https://publish.twitter.com/oembed?omit_script=1&dnt=true&url=${encodeURIComponent(url)}`);
  if (!o?.html) return {};
  const text = htmlToText(o.html.replace(/<blockquote[^>]*>|<\/blockquote>/gi, "")).replace(/—\s*[^—]*$/, "").trim();
  return { title: null, author: o.author_name ? `${o.author_name}${o.author_url ? ` (@${o.author_url.split("/").pop()})` : ""}` : null, content: text };
}

async function instagram(url: string): Promise<Partial<Extracted>> {
  const token = await getMetaToken();
  if (token) {
    const o = await getJson<OEmbed>(`https://graph.facebook.com/v23.0/instagram_oembed?omitscript=true&url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(token)}`);
    if (o) {
      const caption = o.title ?? (o.html ? htmlToText(o.html) : "");
      return { title: null, author: o.author_name ? `@${o.author_name}` : null, thumbnailUrl: o.thumbnail_url ?? null, content: caption };
    }
  }
  // Sem token (ou falhou): as meta tags às vezes trazem a legenda.
  const page = await get(url);
  const desc = page ? meta(page.text, "og:description") : null;
  // Formato: "1,234 likes, 56 comments - usuario on November 1: "legenda""
  const caption =
    desc
      ?.replace(/^[\d.,\s\wK]+likes?,[\s\d.,\wK]+comments? - /i, "")
      .replace(/^[\w.]+ on [^:]+:\s*/i, "")
      .replace(/^["“]([\s\S]*)["”]\.?$/, "$1")
      .trim() ?? "";
  return {
    title: page ? meta(page.text, "og:title") : null,
    thumbnailUrl: page ? meta(page.text, "og:image") : null,
    content: caption,
    warning: token ? "O Instagram não devolveu a legenda deste post." : "Configure o token da Meta em Integrações para ler legendas do Instagram.",
  };
}

/** Lê o link. Nunca lança: o que não der para ler fica vazio. */
export async function extract(rawUrl: string): Promise<Extracted> {
  let url = normalizeUrl(rawUrl) ?? rawUrl;
  // Links encurtados (vm.tiktok, t.co, youtu.be…) → endereço final.
  if (/^https?:\/\/(vm\.tiktok\.com|vt\.tiktok\.com|t\.co|instagr\.am|bit\.ly)\//i.test(url)) {
    const r = await get(url, { maxBytes: 50_000 });
    if (r?.url) url = normalizeUrl(r.url) ?? url;
  }
  const platform = detectPlatform(url);
  let data: Partial<Extracted> = {};
  if (platform === "tiktok") data = await tiktok(url);
  else if (platform === "youtube") data = await youtube(url);
  else if (platform === "x") data = await x(url);
  else if (platform === "instagram") data = await instagram(url);

  // Sites (e redes quando o oEmbed não respondeu): HTML da página.
  if (platform === "web" || (!data.content && platform !== "instagram")) {
    const page = await get(url);
    if (page && page.status < 400) data = { ...pageExtract(url, page.text), ...Object.fromEntries(Object.entries(data).filter(([, v]) => v)) };
  }
  return {
    url,
    platform,
    title: data.title?.slice(0, 300) ?? null,
    author: data.author?.slice(0, 120) ?? null,
    thumbnailUrl: data.thumbnailUrl && /^https:\/\//.test(data.thumbnailUrl) ? data.thumbnailUrl : null,
    content: (data.content ?? "").slice(0, MAX_CONTENT),
    warning: data.warning,
  };
}
