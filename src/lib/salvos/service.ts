// Salvos: salvar (ler + categorizar), buscar, editar, excluir. Compartilhado
// pelas rotas do app, pelo atalho do iPhone e pelo MCP.
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AiError, aiJson } from "@/lib/ai/client";
import { db, savedLinks, type SavedLinkRow } from "@/lib/db/client";
import { extract, normalizeUrl } from "./extract";
import type { Platform } from "./platforms";

export type SavedLinkDTO = {
  id: string;
  url: string;
  platform: Platform;
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
  content: string | null;
  transcript: string | null;
  summary: string | null;
  details: string | null;
  category: string | null;
  tags: string[];
  note: string | null;
  status: "pending" | "ready" | "error";
  error: string | null;
  via: "agent" | "shortcut" | null;
  createdAt: string;
};

export const toDTO = (r: SavedLinkRow): SavedLinkDTO => ({
  id: r.id,
  url: r.url,
  platform: r.platform as Platform,
  title: r.title,
  author: r.author,
  thumbnailUrl: r.thumbnailUrl,
  content: r.content,
  transcript: r.transcript,
  summary: r.summary,
  details: r.details,
  category: r.category,
  tags: r.tags,
  note: r.note,
  status: r.status as SavedLinkDTO["status"],
  error: r.error,
  via: r.via === "agent" || r.via === "shortcut" ? r.via : null,
  createdAt: r.createdAt.toISOString(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Normalização de categoria e tags ────────────────────────────────────────

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Reaproveita a grafia de uma categoria existente ("receitas" → "Receitas"). */
export function normalizeCategory(raw: string | null | undefined, existing: string[]): string | null {
  const t = raw?.replace(/\s+/g, " ").trim().slice(0, 40);
  if (!t) return null;
  return existing.find((c) => fold(c) === fold(t)) ?? t.charAt(0).toUpperCase() + t.slice(1);
}

export function normalizeTags(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[\s,]+/) : [];
  const out: string[] = [];
  for (const v of list) {
    if (typeof v !== "string") continue;
    const t = v.replace(/^#+/, "").toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 30);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 10);
}

// ── Leitura ─────────────────────────────────────────────────────────────────

export async function listCategories(): Promise<{ name: string; count: number }[]> {
  const rows = await db
    .select({ name: savedLinks.category, count: sql<number>`count(*)::int` })
    .from(savedLinks)
    .groupBy(savedLinks.category)
    .orderBy(desc(sql`count(*)`));
  return rows.filter((r): r is { name: string; count: number } => !!r.name);
}

export async function topTags(limit = 40): Promise<{ tag: string; count: number }[]> {
  const rows = await db.execute<{ tag: string; count: number }>(
    sql`select tag, count(*)::int as count from ${savedLinks}, unnest(${savedLinks.tags}) as tag group by tag order by count desc, tag limit ${limit}`,
  );
  return [...rows];
}

/** Sem acentos e em minúsculas, igual nos dois lados da busca. */
const norm = (expr: ReturnType<typeof sql>) => sql`translate(lower(${expr}), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')`;
const doc = sql`coalesce(${savedLinks.title},'') || ' ' || coalesce(${savedLinks.summary},'') || ' ' || coalesce(${savedLinks.category},'') || ' ' || array_to_string(${savedLinks.tags}, ' ') || ' ' || coalesce(${savedLinks.note},'') || ' ' || coalesce(${savedLinks.content},'') || ' ' || coalesce(${savedLinks.details},'') || ' ' || coalesce(${savedLinks.transcript},'')`;

/**
 * Busca: texto livre (com radicais do português, sem acento), "#tag" exige a
 * tag, e `category` filtra. Sem consulta, lista os mais recentes.
 */
export async function searchLinks(opts: { q?: string; category?: string | null; limit?: number; offset?: number } = {}): Promise<{ items: SavedLinkDTO[]; total: number }> {
  const conds = [];
  const words: string[] = [];
  for (const part of (opts.q ?? "").trim().split(/\s+/).filter(Boolean)) {
    if (part.startsWith("#")) {
      const tag = normalizeTags([part])[0];
      if (tag) conds.push(sql`${tag} = any(${savedLinks.tags})`);
    } else words.push(part);
  }
  const text = words.join(" ");
  if (opts.category === "") conds.push(sql`${savedLinks.category} is null`);
  else if (opts.category) conds.push(eq(savedLinks.category, opts.category));
  let rank: ReturnType<typeof sql> | null = null;
  // Qualquer palavra (OU), também por prefixo; a relevância ordena quem bate
  // mais palavras primeiro. Perguntas como "como fazer polenta" funcionam.
  const terms = fold(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1)
    .map((w) => `${w}:*`);
  if (terms.length) {
    const query = sql`to_tsquery('portuguese', ${terms.join(" | ")})`;
    const vector = sql`to_tsvector('portuguese', ${norm(doc)})`;
    conds.push(sql`(${vector} @@ ${query} or ${norm(doc)} like ${`%${fold(text)}%`})`);
    rank = sql`ts_rank(${vector}, ${query})`;
  }
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(savedLinks)
      .where(where)
      .orderBy(...(rank ? [desc(rank), desc(savedLinks.createdAt)] : [desc(savedLinks.createdAt)]))
      .limit(Math.min(opts.limit ?? 60, 200))
      .offset(opts.offset ?? 0),
    db.select({ total: sql<number>`count(*)::int` }).from(savedLinks).where(where),
  ]);
  return { items: rows.map(toDTO), total };
}

export async function getLink(id: string): Promise<SavedLinkDTO | null> {
  if (!UUID_RE.test(id)) return null;
  const [r] = await db.select().from(savedLinks).where(eq(savedLinks.id, id)).limit(1);
  return r ? toDTO(r) : null;
}

// ── Categorização por IA ────────────────────────────────────────────────────

const Categorized = z.object({
  title: z.string().describe("Título curto e descritivo em português, até 70 caracteres"),
  summary: z.string().describe("1 ou 2 frases em português dizendo o que tem de útil no conteúdo"),
  details: z
    .string()
    .describe(
      "O que dá para aproveitar sem rever o conteúdo, em texto simples: linhas curtas de título (ex.: Ingredientes, Passo a passo, Pontos principais) seguidas de itens começando com '- '. Receita: rendimento, ingredientes com quantidades, passos, tempos e temperaturas. Treino: exercícios, séries e repetições. Tutorial: passos. Só o que está no conteúdo ou na transcrição; string vazia se não houver nada além do resumo.",
    ),
  category: z.string().describe("Uma categoria ampla; prefira uma das existentes"),
  tags: z.array(z.string()).describe("3 a 6 tags curtas, minúsculas, sem #"),
});

async function categorize(e: { url: string; platform: string; title: string | null; author: string | null; content: string; transcript?: string | null; note?: string | null }) {
  // Sem nada para ler, a IA só chutaria (ex.: "Humor"): melhor deixar sem
  // categoria e pedir uma nota.
  if (!e.content.trim() && !e.title && !e.note?.trim() && !e.transcript?.trim()) return null;
  const [cats, tags] = await Promise.all([listCategories(), topTags(30)]);
  const out = await aiJson({
    name: "salvo",
    schema: Categorized,
    system:
      "Você organiza links que o Felipe salvou (vídeos de TikTok/Instagram/YouTube, posts do X, sites). " +
      "Leia o conteúdo (e a transcrição do que é falado, quando houver) e devolva título, resumo, detalhes, uma categoria e tags, tudo em português do Brasil. " +
      "A transcrição é automática e pode ter erros de reconhecimento: corrija o óbvio pelo contexto, sem inventar. " +
      "Categoria é ampla (ex.: Receitas, Treino, Casa, Tech, Pets, Viagem, Finanças, Humor): use uma das existentes quando servir; crie outra só se nenhuma servir. " +
      "Tags são específicas (ingrediente, técnica, assunto) e reaproveitam as existentes quando fizer sentido. " +
      "Se o conteúdo estiver vazio, deduza o que der pelo link e pelo autor, sem inventar detalhes.",
    user: [
      `Categorias existentes: ${cats.map((c) => c.name).join(", ") || "(nenhuma ainda)"}`,
      `Tags mais usadas: ${tags.map((t) => t.tag).join(", ") || "(nenhuma ainda)"}`,
      "",
      `Link: ${e.url}`,
      `Plataforma: ${e.platform}`,
      e.author ? `Autor: ${e.author}` : null,
      e.title ? `Título original: ${e.title}` : null,
      e.note ? `Nota do Felipe: ${e.note}` : null,
      "Conteúdo:",
      "<conteudo>",
      e.content.slice(0, 8000) || "(vazio)",
      "</conteudo>",
      e.transcript ? `Transcrição do áudio:\n<transcricao>\n${e.transcript.slice(0, 12000)}\n</transcricao>` : null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
    maxTokens: 2500,
  });
  if (!out) return null;
  return {
    title: out.title.trim().slice(0, 120) || null,
    summary: out.summary.trim().slice(0, 500) || null,
    details: out.details.trim().slice(0, 6000) || null,
    category: normalizeCategory(out.category, cats.map((c) => c.name)),
    tags: normalizeTags(out.tags).slice(0, 6),
  };
}

// ── Escrita ─────────────────────────────────────────────────────────────────

export type SaveResult = { item: SavedLinkDTO; duplicate: boolean; warning?: string };

/** Lê o link, categoriza (se houver IA configurada) e grava. */
async function processRow(id: string, opts: { keepManual?: boolean } = {}): Promise<{ item: SavedLinkDTO; warning?: string }> {
  const [row] = await db.select().from(savedLinks).where(eq(savedLinks.id, id)).limit(1);
  const e = await extract(row.url);
  const fallbackTitle = e.title ?? (e.content ? e.content.split("\n")[0].slice(0, 90) : null);
  let ai: Awaited<ReturnType<typeof categorize>> = null;
  let aiError: string | null = null;
  try {
    ai = await categorize({ ...e, transcript: e.transcript ?? row.transcript, note: row.note });
  } catch (err) {
    aiError = err instanceof AiError ? err.message : "Falha ao categorizar.";
  }
  const manualCategory = opts.keepManual ? row.category : null;
  const [updated] = await db
    .update(savedLinks)
    .set({
      platform: e.platform,
      title: ai?.title ?? fallbackTitle ?? row.title,
      author: e.author,
      thumbnailUrl: e.thumbnailUrl,
      content: e.content || null,
      // Se a legenda não veio desta vez, a que já estava guardada fica.
      transcript: e.transcript ?? row.transcript,
      summary: ai?.summary ?? row.summary,
      details: ai ? ai.details : row.details,
      category: manualCategory ?? ai?.category ?? row.category,
      // Sem resposta da IA, as tags atuais ficam como estão.
      tags: ai ? normalizeTags([...(opts.keepManual ? row.tags : []), ...ai.tags]) : row.tags,
      status: aiError && !e.content ? "error" : "ready",
      error: aiError,
      updatedAt: new Date(),
    })
    .where(eq(savedLinks.id, id))
    .returning();
  const unread = !e.content.trim() && !e.title
    ? "Não consegui ler o conteúdo deste link. Escreva uma nota sobre ele e toque em Reprocessar para categorizar."
    : null;
  return { item: toDTO(updated), warning: [e.warning, unread, aiError].filter(Boolean).join(" ") || undefined };
}

export async function saveLink(input: { url: unknown; note?: unknown; category?: unknown; tags?: unknown }, via: "agent" | "shortcut" | null = null): Promise<SaveResult | { error: string }> {
  const url = typeof input.url === "string" ? normalizeUrl(input.url) : null;
  if (!url) return { error: "Link inválido." };
  const [existing] = await db.select().from(savedLinks).where(eq(savedLinks.url, url)).limit(1);
  if (existing) return { item: toDTO(existing), duplicate: true };

  const note = typeof input.note === "string" ? input.note.trim().slice(0, 4000) || null : null;
  const manualTags = normalizeTags(input.tags);
  const cats = await listCategories();
  const manualCategory = typeof input.category === "string" ? normalizeCategory(input.category, cats.map((c) => c.name)) : null;
  const [row] = await db
    .insert(savedLinks)
    .values({ url, platform: "web", note, via, category: manualCategory, tags: manualTags })
    .onConflictDoNothing()
    .returning();
  if (!row) {
    const [again] = await db.select().from(savedLinks).where(eq(savedLinks.url, url)).limit(1);
    return { item: toDTO(again), duplicate: true };
  }
  const { item, warning } = await processRow(row.id, { keepManual: !!manualCategory || manualTags.length > 0 });
  return { item, duplicate: false, warning };
}

export async function reprocessLink(id: string) {
  if (!(await getLink(id))) return null;
  return processRow(id, { keepManual: false });
}

export async function updateLink(id: string, input: { title?: unknown; category?: unknown; tags?: unknown; note?: unknown; summary?: unknown }): Promise<SavedLinkDTO | null | string> {
  const current = await getLink(id);
  if (!current) return null;
  const set: Partial<typeof savedLinks.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) {
    const t = typeof input.title === "string" ? input.title.trim().slice(0, 200) : "";
    if (!t) return "Dê um título.";
    set.title = t;
  }
  if (input.category !== undefined) {
    const cats = await listCategories();
    set.category = typeof input.category === "string" ? normalizeCategory(input.category, cats.map((c) => c.name)) : null;
  }
  if (input.tags !== undefined) set.tags = normalizeTags(input.tags);
  if (input.note !== undefined) set.note = typeof input.note === "string" ? input.note.trim().slice(0, 4000) || null : null;
  if (input.summary !== undefined) set.summary = typeof input.summary === "string" ? input.summary.trim().slice(0, 500) || null : null;
  const [row] = await db.update(savedLinks).set(set).where(eq(savedLinks.id, id)).returning();
  return toDTO(row);
}

export async function deleteLink(id: string): Promise<boolean> {
  if (!UUID_RE.test(id)) return false;
  const res = await db.delete(savedLinks).where(eq(savedLinks.id, id)).returning({ id: savedLinks.id });
  return res.length > 0;
}

/** Números para a home. */
export async function linkStats(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [[row], cats] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int`, week: sql<number>`count(*) filter (where ${savedLinks.createdAt} >= ${weekAgo.toISOString()}::timestamptz)::int` })
      .from(savedLinks),
    listCategories(),
  ]);
  return { total: row.total, week: row.week, categories: cats.length };
}
