// Agenda: tipos e datas puras (usados no servidor, na tela e no MCP).
import { APP_TZ } from "@/lib/format-date";
import { addDays, todayKey, weekdayOf } from "@/lib/tasks/model";

export type CalendarInfo = {
  id: string;
  name: string;
  color: string;
  primary: boolean;
  writable: boolean;
};

export type AgendaItem = {
  /** id do evento no Google (ou da tarefa) */
  id: string;
  kind: "event" | "task";
  calendarId: string | null;
  title: string;
  allDay: boolean;
  /** Primeiro dia ("YYYY-MM-DD", fuso de São Paulo). */
  date: string;
  /** Último dia (inclusive) — igual a `date` na maioria dos eventos. */
  endDate: string;
  /** "HH:MM" em São Paulo; null em dia inteiro. */
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  link: string | null;
  color: string;
  recurring: boolean;
};

export const TASK_COLOR = "var(--muted-foreground)";

const hmFmt = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** "16:30" no fuso de São Paulo. */
export const timeOf = (iso: string) => hmFmt.format(new Date(iso));
/** Dia ("YYYY-MM-DD") de um instante, no fuso de São Paulo. */
export const dayOf = (iso: string) => todayKey(new Date(iso));

/** Segunda-feira da semana de `key`. */
export const weekStart = (key: string) => addDays(key, -((weekdayOf(key) + 6) % 7));

export const minutesOf = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

/** Itens que caem em `day` (eventos de vários dias aparecem em cada dia). */
export const itemsOn = (items: AgendaItem[], day: string) => items.filter((i) => i.date <= day && i.endDate >= day);

export function sortItems(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      Number(b.allDay) - Number(a.allDay) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
      a.title.localeCompare(b.title),
  );
}

/** "16:30 – 17:30", "dia todo", "10:00 · tarefa" */
export function timeLabel(i: AgendaItem): string {
  if (i.allDay) return i.date === i.endDate ? "dia todo" : "vários dias";
  const range = i.endTime && i.endTime !== i.startTime ? `${i.startTime} – ${i.endTime}` : `${i.startTime}`;
  return i.kind === "task" ? `${i.startTime} · tarefa` : range;
}

const WEEKDAY_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MONTH_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "Hoje · sexta, 27" / "Amanhã · sábado, 28" / "Domingo, 29 nov" */
export function dayHeading(key: string, today: string): string {
  const d = Number(key.slice(8));
  const wd = WEEKDAY_LONG[weekdayOf(key)];
  if (key === today) return `Hoje · ${wd}, ${d}`;
  if (key === addDays(today, 1)) return `Amanhã · ${wd}, ${d}`;
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${d} ${MONTH_SHORT[Number(key.slice(5, 7)) - 1]}`;
}

/** "23 – 29 nov 2026", "30 nov – 6 dez 2026" */
export function rangeTitle(from: string, to: string): string {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  if (from === to) return `${d1} de ${MONTH_LONG[m1 - 1]} ${y1}`;
  if (m1 === m2 && y1 === y2) return `${d1} – ${d2} ${MONTH_SHORT[m2 - 1]} ${y2}`;
  return `${d1} ${MONTH_SHORT[m1 - 1]}${y1 !== y2 ? ` ${y1}` : ""} – ${d2} ${MONTH_SHORT[m2 - 1]} ${y2}`;
}

export const monthName = (key: string) => {
  const m = MONTH_LONG[Number(key.slice(5, 7)) - 1];
  return m.charAt(0).toUpperCase() + m.slice(1);
};

export const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
