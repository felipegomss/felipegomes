// Consultas e ações sobre vagas, compartilhadas pelas rotas do app e pelo MCP.
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, jobPosts, JOB_SOURCES, JOB_STATUSES, type JobPost, type JobStatus } from "@/lib/db/client";

export type JobFilters = {
  status?: string | null;
  source?: string | null;
  starredOnly?: boolean;
  q?: string | null;
  limit?: number;
  offset?: number;
};

export async function listJobs(f: JobFilters): Promise<{ data: JobPost[]; total: number; limit: number; offset: number }> {
  const limit = Math.min(Math.max(Number(f.limit ?? 50) || 50, 1), 100);
  const offset = Math.max(Number(f.offset ?? 0) || 0, 0);
  const conditions: SQL[] = [];
  if (f.status && (JOB_STATUSES as readonly string[]).includes(f.status)) conditions.push(eq(jobPosts.status, f.status));
  if (f.source && (JOB_SOURCES as readonly string[]).includes(f.source)) conditions.push(eq(jobPosts.source, f.source));
  if (f.starredOnly) conditions.push(eq(jobPosts.starred, true));
  if (f.q) {
    const like = `%${f.q}%`;
    const search = or(ilike(jobPosts.title, like), ilike(jobPosts.body, like), ilike(jobPosts.company, like));
    if (search) conditions.push(search);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, [{ count }]] = await Promise.all([
    db.select().from(jobPosts).where(where).orderBy(desc(jobPosts.postedAt), desc(jobPosts.scrapedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(jobPosts).where(where),
  ]);
  return { data: rows, total: count, limit, offset };
}

export async function getJob(id: string): Promise<JobPost | null> {
  const [row] = await db.select().from(jobPosts).where(eq(jobPosts.id, id)).limit(1);
  return row ?? null;
}

export async function updateJob(
  id: string,
  patch: { status?: unknown; starred?: unknown },
): Promise<{ ok: true; value: JobPost } | { ok: false; status: 400 | 404; error: string }> {
  const updates: { status?: JobStatus; starred?: boolean } = {};
  let stampContactedAt = false;
  if (typeof patch.status === "string") {
    if (!(JOB_STATUSES as readonly string[]).includes(patch.status)) return { ok: false, status: 400, error: "Status inválido." };
    updates.status = patch.status as JobStatus;
    stampContactedAt = patch.status === "contacted";
  }
  if (typeof patch.starred === "boolean") updates.starred = patch.starred;
  if (Object.keys(updates).length === 0) return { ok: false, status: 400, error: "Nada a atualizar." };

  // Preserva a data do primeiro contato ao alternar status.
  const set = stampContactedAt ? { ...updates, contactedAt: sql`COALESCE(${jobPosts.contactedAt}, NOW())` } : updates;
  const updated = await db.update(jobPosts).set(set).where(eq(jobPosts.id, id)).returning();
  if (updated.length === 0) return { ok: false, status: 404, error: "Não encontrado." };
  return { ok: true, value: updated[0] };
}
