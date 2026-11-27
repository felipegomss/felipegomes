// Tarefas: tipos, datas (dias do calendário no fuso de São Paulo), repetição,
// agrupamento e rótulos. Arquivo puro — usado no servidor, na tela e no MCP.
import { APP_TZ } from "@/lib/format-date";

export const TASK_REPEATS = ["none", "daily", "weekly", "monthly"] as const;
export type TaskRepeat = (typeof TASK_REPEATS)[number];

export const DEFAULT_LISTS = ["Pessoal", "Trabalho", "Casa"] as const;

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  list: string;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  /** "HH:MM" */
  dueTime: string | null;
  repeat: TaskRepeat;
  /** 0 = domingo … 6 = sábado (só para semanal). */
  repeatDays: number[] | null;
  via: "agent" | null;
  completedAt: string | null;
  createdAt: string;
};

// ── Dias do calendário ("YYYY-MM-DD") ───────────────────────────────────────

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Hoje (ou `now`) em São Paulo, como "YYYY-MM-DD". */
export const todayKey = (now = new Date()) => keyFmt.format(now);

const toUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fromUtc = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (key: string, n: number) => {
  const d = toUtc(key);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
};
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
export const weekdayOf = (key: string) => toUtc(key).getUTCDay();
export const isDayKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && fromUtc(toUtc(v)) === v;
export const isTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Mesmo dia do mês, `n` meses depois (dia 31 → último dia do mês). */
export function addMonths(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return fromUtc(new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))));
}

/** Próxima data (a partir de `from`, inclusive) cujo dia da semana está em `days`. */
export function nextWeekday(from: string, days: number[], inclusive = true): string {
  for (let i = inclusive ? 0 : 1; i <= 7; i++) {
    const k = addDays(from, i);
    if (days.includes(weekdayOf(k))) return k;
  }
  return addDays(from, 7);
}

/**
 * Data da próxima ocorrência ao concluir uma tarefa repetida. Conta a partir
 * do que for mais tarde entre o vencimento e hoje — concluir atrasado não
 * cria uma ocorrência já vencida.
 */
export function nextOccurrence(t: Pick<TaskDTO, "repeat" | "repeatDays" | "dueDate">, today: string): string | null {
  if (t.repeat === "none") return null;
  const due = t.dueDate ?? today;
  const base = due > today ? due : today;
  if (t.repeat === "daily") return addDays(base, 1);
  if (t.repeat === "weekly") {
    const days = t.repeatDays?.length ? t.repeatDays : [weekdayOf(due)];
    return nextWeekday(base, days, false);
  }
  let next = addMonths(due, 1);
  while (next <= today) next = addMonths(next, 1);
  return next;
}

// ── Rótulos ─────────────────────────────────────────────────────────────────

const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "hoje", "amanhã", "ontem", "sex, 29 nov" (com o ano se for outro). */
export function dayLabel(key: string, today: string): string {
  const diff = daysBetween(today, key);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  const [y, m, d] = key.split("-").map(Number);
  const year = y === Number(today.slice(0, 4)) ? "" : ` ${y}`;
  return `${WEEKDAY_SHORT[weekdayOf(key)]}, ${d} ${MONTH_SHORT[m - 1]}${year}`;
}

/** Rótulo do prazo: "venceu 25 nov", "hoje 10:00", "sex, 29 nov · 14:30". */
export function dueLabel(t: Pick<TaskDTO, "dueDate" | "dueTime">, today: string): string | null {
  if (!t.dueDate) return null;
  if (t.dueDate < today) {
    const [, m, d] = t.dueDate.split("-").map(Number);
    return daysBetween(t.dueDate, today) === 1 ? "venceu ontem" : `venceu ${d} ${MONTH_SHORT[m - 1]}`;
  }
  const day = dayLabel(t.dueDate, today);
  return t.dueTime ? `${day}${day === "hoje" || day === "amanhã" ? " " : " · "}${t.dueTime}` : day;
}

export function repeatLabel(t: Pick<TaskDTO, "repeat" | "repeatDays">): string | null {
  if (t.repeat === "daily") return "todo dia";
  if (t.repeat === "monthly") return "todo mês";
  if (t.repeat === "weekly") {
    const days = [...(t.repeatDays ?? [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    return days.length && days.length < 7 ? days.map((d) => WEEKDAY_SHORT[d]).join(", ") : "toda semana";
  }
  return null;
}

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: d, label: WEEKDAY_SHORT[d] }));

// ── Agrupamento ─────────────────────────────────────────────────────────────

export type TaskGroupId = "overdue" | "today" | "week" | "later" | "nodate";
export const GROUP_TITLES: Record<TaskGroupId, string> = {
  overdue: "Atrasadas",
  today: "Hoje",
  week: "Próximos 7 dias",
  later: "Mais tarde",
  nodate: "Sem data",
};

export function groupOf(t: Pick<TaskDTO, "dueDate">, today: string): TaskGroupId {
  if (!t.dueDate) return "nodate";
  if (t.dueDate < today) return "overdue";
  if (t.dueDate === today) return "today";
  return daysBetween(today, t.dueDate) <= 7 ? "week" : "later";
}

const byDue = (a: TaskDTO, b: TaskDTO) =>
  (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
  (a.dueTime ?? "99").localeCompare(b.dueTime ?? "99") ||
  a.createdAt.localeCompare(b.createdAt);

/** Abertas por grupo (só grupos com itens), na ordem de exibição. */
export function groupTasks(open: TaskDTO[], today: string) {
  const order: TaskGroupId[] = ["overdue", "today", "week", "later", "nodate"];
  return order
    .map((id) => ({ id, title: GROUP_TITLES[id], tasks: open.filter((t) => groupOf(t, today) === id).sort(byDue) }))
    .filter((g) => g.tasks.length > 0);
}

/** Números para a home, a sidebar e o resumo do agente. */
export function taskCounts(open: TaskDTO[], today: string) {
  let overdue = 0, dueToday = 0, week = 0;
  for (const t of open) {
    const g = groupOf(t, today);
    if (g === "overdue") overdue++;
    else if (g === "today") dueToday++;
    else if (g === "week") week++;
  }
  return { overdue, today: dueToday, week, open: open.length };
}

/** Listas para os filtros: as padrão + as que já existem nas tarefas. */
export function listsOf(tasks: TaskDTO[]): string[] {
  const seen = new Map<string, string>();
  for (const l of [...DEFAULT_LISTS, ...tasks.map((t) => t.list)]) {
    if (!seen.has(l.toLowerCase())) seen.set(l.toLowerCase(), l);
  }
  return [...seen.values()];
}
