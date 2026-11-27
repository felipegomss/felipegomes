// Google Agenda: listar agendas e eventos, criar/editar/excluir. Lê e escreve
// direto no Google (nada de cópia local). Só a lista de agendas tem cache
// curto: eventos não, porque a rota que cria e a página que lista podem rodar
// em instâncias diferentes e o cache de uma não enxergaria a escrita da outra.
import { eq } from "drizzle-orm";
import { db, googleAccounts, type GoogleAccount } from "@/lib/db/client";
import { APP_TZ } from "@/lib/format-date";
import { GOOGLE, GoogleAuthError, accessToken, getGoogleAccount } from "@/lib/google/oauth";
import { addDays, isDayKey, isTime, todayKey } from "@/lib/tasks/model";
import { listOpenTasks } from "@/lib/tasks/service";
import { TASK_COLOR, dayOf, minutesOf, sortItems, timeOf, type AgendaItem, type CalendarInfo } from "./model";

export class CalendarError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

async function api<T>(acc: GoogleAccount, path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(acc);
  const res = await fetch(`${GOOGLE.calendar}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init.headers },
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    if (res.status === 401) throw new GoogleAuthError("O Google recusou o acesso. Conecte de novo.");
    if (res.status === 404 || res.status === 410) throw new CalendarError("Evento não encontrado.", 404);
    throw new CalendarError(`Google Agenda: ${msg}`, res.status >= 500 ? 502 : 400);
  }
  return data as T;
}

// ── Cache curto (por instância), só para a lista de agendas ─────────────────

const TTL = 5 * 60_000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}
const invalidate = () => cache.clear();

// ── Agendas ─────────────────────────────────────────────────────────────────

type GCalendar = { id: string; summary: string; summaryOverride?: string; backgroundColor?: string; primary?: boolean; selected?: boolean; accessRole: string };

async function googleCalendars(acc: GoogleAccount): Promise<(CalendarInfo & { selected: boolean })[]> {
  return cached(`cals:${acc.connectedAt.getTime()}`, async () => {
    const data = await api<{ items?: GCalendar[] }>(acc, "/users/me/calendarList?maxResults=100");
    return (data.items ?? [])
      .filter((c) => c.accessRole !== "freeBusyReader")
      .map((c) => ({
        id: c.id,
        name: c.summaryOverride ?? (c.primary ? "Pessoal" : c.summary),
        color: c.backgroundColor ?? "#60a5fa",
        primary: !!c.primary,
        writable: c.accessRole === "owner" || c.accessRole === "writer",
        selected: !!c.selected || !!c.primary,
      }))
      .sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name));
  });
}

export type AgendaSettings = {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
  calendars: (CalendarInfo & { visible: boolean })[];
  defaultId: string | null;
  showTasks: boolean;
};

export async function getAgendaSettings(): Promise<AgendaSettings> {
  const acc = await getGoogleAccount();
  if (!acc) return { connected: false, email: null, connectedAt: null, calendars: [], defaultId: null, showTasks: true };
  const cals = await googleCalendars(acc);
  const visible = acc.calendars?.visible ?? cals.filter((c) => c.selected).map((c) => c.id);
  const defaultId =
    acc.calendars?.defaultId && cals.some((c) => c.id === acc.calendars!.defaultId && c.writable)
      ? acc.calendars.defaultId
      : (cals.find((c) => c.primary)?.id ?? cals.find((c) => c.writable)?.id ?? null);
  return {
    connected: true,
    email: acc.email,
    connectedAt: acc.connectedAt.toISOString(),
    calendars: cals.map(({ selected: _selected, ...c }) => ({ ...c, visible: visible.includes(c.id) })),
    defaultId,
    showTasks: acc.showTasks,
  };
}

export async function updateAgendaSettings(input: { visible?: unknown; defaultId?: unknown; showTasks?: unknown }) {
  const acc = await getGoogleAccount();
  if (!acc) throw new CalendarError("Google Agenda não conectado.", 404);
  const current = await getAgendaSettings();
  const ids = new Set(current.calendars.map((c) => c.id));
  const visible = Array.isArray(input.visible)
    ? input.visible.filter((v): v is string => typeof v === "string" && ids.has(v))
    : current.calendars.filter((c) => c.visible).map((c) => c.id);
  const defaultId = typeof input.defaultId === "string" && ids.has(input.defaultId) ? input.defaultId : current.defaultId;
  await db
    .update(googleAccounts)
    .set({
      calendars: { visible, defaultId },
      ...(typeof input.showTasks === "boolean" ? { showTasks: input.showTasks } : {}),
    })
    .where(eq(googleAccounts.id, acc.id));
  invalidate();
}

// ── Eventos ─────────────────────────────────────────────────────────────────

type GTime = { date?: string; dateTime?: string; timeZone?: string };
type GEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GTime;
  end: GTime;
  htmlLink?: string;
  recurringEventId?: string;
};

function toItem(e: GEvent, cal: CalendarInfo): AgendaItem {
  const allDay = !!e.start.date;
  const date = allDay ? e.start.date! : dayOf(e.start.dateTime!);
  // Fim de dia inteiro no Google é exclusivo.
  const endDate = allDay ? addDays(e.end.date ?? e.start.date!, -1) : dayOf(e.end.dateTime ?? e.start.dateTime!);
  return {
    id: e.id,
    kind: "event",
    calendarId: cal.id,
    title: e.summary?.trim() || "(sem título)",
    allDay,
    date,
    endDate: endDate < date ? date : endDate,
    startTime: allDay ? null : timeOf(e.start.dateTime!),
    endTime: allDay ? null : timeOf(e.end.dateTime ?? e.start.dateTime!),
    location: e.location ?? null,
    description: e.description ?? null,
    link: e.htmlLink ?? null,
    color: cal.color,
    recurring: !!e.recurringEventId,
  };
}

/** Meia-noite de `key` em São Paulo como ISO (o Brasil não tem horário de verão desde 2019). */
const startOfDay = (key: string) => `${key}T00:00:00-03:00`;

/**
 * Eventos das agendas visíveis entre `from` e `to` (dias, inclusive), mais as
 * tarefas abertas com data nesse intervalo, se `showTasks`.
 */
export async function listAgenda(from: string, to: string): Promise<{ items: AgendaItem[]; settings: AgendaSettings }> {
  const settings = await getAgendaSettings();
  if (!settings.connected) return { items: [], settings };
  const acc = (await getGoogleAccount())!;
  const visible = settings.calendars.filter((c) => c.visible);

  const events = await (async () => {
    const params = new URLSearchParams({
      timeMin: startOfDay(from),
      timeMax: startOfDay(addDays(to, 1)),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      timeZone: APP_TZ,
    });
    const lists = await Promise.all(
      visible.map((cal) =>
        api<{ items?: GEvent[] }>(acc, `/calendars/${encodeURIComponent(cal.id)}/events?${params}`).then((d) =>
          (d.items ?? []).filter((e) => e.status !== "cancelled").map((e) => toItem(e, cal)),
        ),
      ),
    );
    return lists.flat();
  })();

  const tasks: AgendaItem[] = settings.showTasks
    ? (await listOpenTasks())
        .filter((t) => t.dueDate && t.dueDate >= from && t.dueDate <= to)
        .map((t) => {
          const end = t.dueTime ? Math.min(minutesOf(t.dueTime) + 30, 23 * 60 + 59) : null;
          return {
            id: t.id,
            kind: "task" as const,
            calendarId: null,
            title: t.title,
            allDay: !t.dueTime,
            date: t.dueDate!,
            endDate: t.dueDate!,
            startTime: t.dueTime,
            endTime: end === null ? null : `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
            location: null,
            description: t.notes,
            link: null,
            color: TASK_COLOR,
            recurring: t.repeat !== "none",
          };
        })
    : [];

  return { items: sortItems([...events, ...tasks]), settings };
}

export type EventInput = {
  title?: unknown;
  date?: unknown;
  endDate?: unknown;
  start?: unknown;
  end?: unknown;
  allDay?: unknown;
  location?: unknown;
  description?: unknown;
  calendarId?: unknown;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

/** Monta start/end no formato do Google a partir de data + horas. */
function timesFor(date: string, allDay: boolean, start?: string, end?: string, endDate?: string): { start: GTime; end: GTime } {
  if (allDay) {
    const last = endDate && endDate >= date ? endDate : date;
    return { start: { date }, end: { date: addDays(last, 1) } };
  }
  const s = start ?? "09:00";
  let e = end;
  if (!e) {
    const m = Math.min(minutesOf(s) + 60, 23 * 60 + 59);
    e = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }
  // Termina antes de começar = passa da meia-noite.
  const endDay = endDate && endDate > date ? endDate : minutesOf(e) <= minutesOf(s) ? addDays(date, 1) : date;
  return {
    start: { dateTime: `${date}T${s}:00`, timeZone: APP_TZ },
    end: { dateTime: `${endDay}T${e}:00`, timeZone: APP_TZ },
  };
}

function validate(input: EventInput, partial: boolean): string | null {
  if (!partial && !str(input.title, 300)) return "Dê um título ao evento.";
  if (input.date !== undefined && !isDayKey(input.date)) return "Data inválida (use AAAA-MM-DD).";
  if (!partial && input.date === undefined) return "Informe a data.";
  for (const k of ["start", "end"] as const) {
    if (input[k] !== undefined && input[k] !== null && input[k] !== "" && !isTime(input[k])) return "Hora inválida (use HH:MM).";
  }
  if (input.endDate !== undefined && input.endDate !== null && input.endDate !== "" && !isDayKey(input.endDate)) return "Data final inválida.";
  return null;
}

async function writableCalendar(id: unknown): Promise<{ acc: GoogleAccount; cal: CalendarInfo }> {
  const acc = await getGoogleAccount();
  if (!acc) throw new CalendarError("Google Agenda não conectado. Conecte em Agenda › Agendas.", 404);
  const settings = await getAgendaSettings();
  const calId = typeof id === "string" && id ? id : settings.defaultId;
  const cal = settings.calendars.find((c) => c.id === calId);
  if (!cal) throw new CalendarError("Agenda não encontrada.", 404);
  if (!cal.writable) throw new CalendarError(`Sem permissão para editar a agenda ${cal.name}.`);
  return { acc, cal };
}

export async function createEvent(input: EventInput): Promise<AgendaItem> {
  const err = validate(input, false);
  if (err) throw new CalendarError(err);
  const { acc, cal } = await writableCalendar(input.calendarId);
  // Sem hora de início = dia inteiro (a não ser que peçam o contrário).
  const allDay = input.allDay === true || (input.allDay !== false && !input.start);
  const body = {
    summary: str(input.title, 300),
    location: str(input.location, 300) || undefined,
    description: str(input.description, 4000) || undefined,
    ...timesFor(input.date as string, allDay, str(input.start, 5), str(input.end, 5), str(input.endDate, 10)),
  };
  const created = await api<GEvent>(acc, `/calendars/${encodeURIComponent(cal.id)}/events`, { method: "POST", body: JSON.stringify(body) });
  invalidate();
  return toItem(created, cal);
}

/** Edita só o que veio; datas/horas são recalculadas a partir do evento atual. */
export async function updateEvent(calendarId: string, eventId: string, input: EventInput): Promise<AgendaItem> {
  const err = validate(input, true);
  if (err) throw new CalendarError(err);
  const { acc, cal } = await writableCalendar(calendarId);
  const path = `/calendars/${encodeURIComponent(cal.id)}/events/${encodeURIComponent(eventId)}`;
  const current = toItem(await api<GEvent>(acc, path), cal);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const t = str(input.title, 300);
    if (!t) throw new CalendarError("Dê um título ao evento.");
    patch.summary = t;
  }
  if (input.location !== undefined) patch.location = str(input.location, 300) ?? "";
  if (input.description !== undefined) patch.description = str(input.description, 4000) ?? "";
  const touchesTime = ["date", "endDate", "start", "end", "allDay"].some((k) => input[k as keyof EventInput] !== undefined);
  if (touchesTime) {
    const allDay = typeof input.allDay === "boolean" ? input.allDay : input.start ? false : current.allDay;
    const date = (input.date as string | undefined) ?? current.date;
    const start = str(input.start, 5) || current.startTime || undefined;
    const end = input.start && input.end === undefined ? undefined : str(input.end, 5) || current.endTime || undefined;
    const endDate = input.endDate !== undefined ? str(input.endDate, 10) : input.date !== undefined ? undefined : current.endDate;
    Object.assign(patch, timesFor(date, allDay, start, end, endDate));
  }
  if (Object.keys(patch).length === 0) throw new CalendarError("Nada a atualizar.");
  const updated = await api<GEvent>(acc, path, { method: "PATCH", body: JSON.stringify(patch) });
  invalidate();
  return toItem(updated, cal);
}

export async function deleteEvent(calendarId: string, eventId: string): Promise<void> {
  const { acc, cal } = await writableCalendar(calendarId);
  await api<void>(acc, `/calendars/${encodeURIComponent(cal.id)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  invalidate();
}

/** Resumo para a home, a sidebar e o agente: hoje e amanhã. */
export async function upcoming(now = new Date()) {
  const today = todayKey(now);
  const { items, settings } = await listAgenda(today, addDays(today, 1));
  return { today, items, connected: settings.connected };
}
