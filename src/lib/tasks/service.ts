// Ações sobre tarefas, compartilhadas pelas rotas do app e pelo MCP.
import { and, desc, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { db, tasks, type TaskRow } from "@/lib/db/client";
import {
  TASK_REPEATS,
  isDayKey,
  isTime,
  listsOf,
  nextOccurrence,
  todayKey,
  type TaskDTO,
  type TaskRepeat,
} from "./model";
import { parseQuickAdd } from "./parse";

export type TaskResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 404; error: string };
const fail = (status: 400 | 404, error: string) => ({ ok: false as const, status, error });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toTaskDTO(r: TaskRow): TaskDTO {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes,
    list: r.list,
    dueDate: r.dueDate,
    dueTime: r.dueTime,
    repeat: (TASK_REPEATS as readonly string[]).includes(r.repeat) ? (r.repeat as TaskRepeat) : "none",
    repeatDays: r.repeatDays,
    via: r.via === "agent" ? "agent" : null,
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

// ── Leitura ─────────────────────────────────────────────────────────────────

export async function listOpenTasks(): Promise<TaskDTO[]> {
  const rows = await db.select().from(tasks).where(isNull(tasks.completedAt));
  return rows.map(toTaskDTO);
}

/** Concluídas nos últimos `days` dias, da mais recente para a mais antiga. */
export async function listDoneTasks(days = 30, now = new Date()): Promise<TaskDTO[]> {
  const since = new Date(now.getTime() - days * 86_400_000);
  const rows = await db
    .select()
    .from(tasks)
    .where(and(isNotNull(tasks.completedAt), gte(tasks.completedAt, since)))
    .orderBy(desc(tasks.completedAt))
    .limit(200);
  return rows.map(toTaskDTO);
}

export async function getTask(id: string): Promise<TaskDTO | null> {
  if (!UUID_RE.test(id)) return null;
  const [r] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return r ? toTaskDTO(r) : null;
}

// ── Validação ───────────────────────────────────────────────────────────────

export type TaskInput = {
  /** Texto livre do "adicionar rápido" — data, hora, repetição e #lista saem dele. */
  text?: unknown;
  title?: unknown;
  notes?: unknown;
  list?: unknown;
  dueDate?: unknown;
  dueTime?: unknown;
  repeat?: unknown;
  repeatDays?: unknown;
};

type Fields = Partial<Pick<TaskRow, "title" | "notes" | "list" | "dueDate" | "dueTime" | "repeat" | "repeatDays">>;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

/** Normaliza os campos enviados. `undefined` = não mexe; `null`/"" = limpa (onde faz sentido). */
function readFields(input: TaskInput): Fields | string {
  const f: Fields = {};
  if (input.title !== undefined) {
    const t = str(input.title, 300);
    if (!t) return "Dê um nome à tarefa.";
    f.title = t;
  }
  if (input.notes !== undefined) f.notes = str(input.notes, 4000) || null;
  if (input.list !== undefined) f.list = str(input.list, 40) || "Pessoal";
  if (input.dueDate !== undefined) {
    if (input.dueDate === null || input.dueDate === "") f.dueDate = null;
    else if (isDayKey(input.dueDate)) f.dueDate = input.dueDate;
    else return "Data inválida (use AAAA-MM-DD).";
  }
  if (input.dueTime !== undefined) {
    if (input.dueTime === null || input.dueTime === "") f.dueTime = null;
    else if (isTime(input.dueTime)) f.dueTime = input.dueTime;
    else return "Hora inválida (use HH:MM).";
  }
  if (input.repeat !== undefined) {
    if (!(TASK_REPEATS as readonly unknown[]).includes(input.repeat)) return "Repetição inválida.";
    f.repeat = input.repeat as TaskRepeat;
  }
  if (input.repeatDays !== undefined) {
    const days = Array.isArray(input.repeatDays) ? input.repeatDays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6) : [];
    f.repeatDays = days.length ? [...new Set(days)].sort() : null;
  }
  return f;
}

/** Regras entre campos: hora sem data não existe; repetir exige data. */
function settle(f: Fields, today: string): Fields {
  if (f.dueDate === null) f.dueTime = null;
  if (f.repeat && f.repeat !== "none" && !f.dueDate) f.dueDate = today;
  if (f.repeat && f.repeat !== "weekly") f.repeatDays = null;
  return f;
}

// ── Escrita ─────────────────────────────────────────────────────────────────

export async function createTask(input: TaskInput, opts: { via?: "agent"; now?: Date } = {}): Promise<TaskResult<TaskDTO>> {
  const now = opts.now ?? new Date();
  const today = todayKey(now);
  let base: TaskInput = input;
  if (typeof input.text === "string" && input.text.trim()) {
    const lists = listsOf(await listOpenTasks());
    const parsed = parseQuickAdd(input.text, now, lists);
    // Campos explícitos valem mais que o que foi lido do texto.
    base = { ...parsed, ...Object.fromEntries(Object.entries(input).filter(([k, v]) => k !== "text" && v !== undefined)) };
  }
  if (base.title === undefined) return fail(400, "Dê um nome à tarefa.");
  const fields = readFields(base);
  if (typeof fields === "string") return fail(400, fields);
  const values = settle({ list: "Pessoal", repeat: "none", ...fields }, today);
  const [row] = await db
    .insert(tasks)
    .values({ ...values, title: values.title!, via: opts.via ?? null })
    .returning();
  return { ok: true, value: toTaskDTO(row) };
}

export async function updateTask(id: string, input: TaskInput, now = new Date()): Promise<TaskResult<TaskDTO>> {
  const current = await getTask(id);
  if (!current) return fail(404, "Tarefa não encontrada.");
  const fields = readFields(input);
  if (typeof fields === "string") return fail(400, fields);
  if (Object.keys(fields).length === 0) return fail(400, "Nada a atualizar.");
  // `settle` olha o resultado final, não só o que mudou.
  const merged = settle({ dueDate: current.dueDate, repeat: current.repeat, ...fields }, todayKey(now));
  const dueTime = merged.dueDate === null ? null : "dueTime" in fields ? fields.dueTime : undefined;
  const repeatDays = merged.repeat !== "weekly" ? null : "repeatDays" in fields ? fields.repeatDays : undefined;
  const [row] = await db
    .update(tasks)
    .set({ ...fields, dueDate: merged.dueDate, dueTime, repeatDays, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return { ok: true, value: toTaskDTO(row) };
}

/**
 * Concluir (ou desfazer). Tarefa repetida cria a próxima ocorrência ao ser
 * concluída; desfazer apaga essa ocorrência se ela ainda estiver aberta.
 */
export async function setTaskDone(id: string, done: boolean, now = new Date()): Promise<TaskResult<{ task: TaskDTO; next: TaskDTO | null }>> {
  if (!UUID_RE.test(id)) return fail(404, "Tarefa não encontrada.");
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) return fail(404, "Tarefa não encontrada.");
  const current = toTaskDTO(row);

  if (done) {
    if (current.completedAt) return { ok: true, value: { task: current, next: null } };
    let next: TaskDTO | null = null;
    const nextDate = nextOccurrence(current, todayKey(now));
    if (nextDate) {
      const [n] = await db
        .insert(tasks)
        .values({
          title: row.title,
          notes: row.notes,
          list: row.list,
          dueDate: nextDate,
          dueTime: row.dueTime,
          repeat: row.repeat,
          repeatDays: row.repeatDays,
          via: row.via,
        })
        .returning();
      next = toTaskDTO(n);
    }
    const [updated] = await db
      .update(tasks)
      .set({ completedAt: now, spawnedId: next?.id ?? null, updatedAt: now })
      .where(eq(tasks.id, id))
      .returning();
    return { ok: true, value: { task: toTaskDTO(updated), next } };
  }

  if (!current.completedAt) return { ok: true, value: { task: current, next: null } };
  if (row.spawnedId) {
    await db.delete(tasks).where(and(eq(tasks.id, row.spawnedId), isNull(tasks.completedAt)));
  }
  const [updated] = await db
    .update(tasks)
    .set({ completedAt: null, spawnedId: null, updatedAt: now })
    .where(eq(tasks.id, id))
    .returning();
  return { ok: true, value: { task: toTaskDTO(updated), next: null } };
}

export async function deleteTask(id: string): Promise<TaskResult<{ id: string }>> {
  if (!UUID_RE.test(id)) return fail(404, "Tarefa não encontrada.");
  const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
  return deleted.length ? { ok: true, value: { id } } : fail(404, "Tarefa não encontrada.");
}
