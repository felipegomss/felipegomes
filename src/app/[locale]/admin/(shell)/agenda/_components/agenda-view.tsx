"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon, PlusIcon, RepeatIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WEEKDAY_SHORT,
  dayHeading,
  itemsOn,
  minutesOf,
  monthName,
  timeLabel,
  type AgendaItem,
} from "@/lib/calendar/model";
import type { AgendaSettings } from "@/lib/calendar/service";
import { addDays, daysBetween } from "@/lib/tasks/model";
import { EventDialog, type EventDraft } from "./event-dialog";

export type AgendaViewMode = "dia" | "semana" | "lista";

const HOUR = 48;
const SECTION_TITLE = "text-xs font-semibold uppercase tracking-[0.12em]";

/** Cor do evento: borda forte + fundo translúcido; tarefa = tracejado. */
function itemStyle(i: AgendaItem): React.CSSProperties {
  if (i.kind === "task") return { border: "1px dashed var(--muted-foreground)" };
  return { borderLeft: `3px solid ${i.color}`, background: `color-mix(in oklab, ${i.color} 18%, transparent)` };
}

/** Colunas lado a lado para eventos que se sobrepõem no mesmo dia. */
function layoutDay(items: AgendaItem[]) {
  const timed = items
    .filter((i) => !i.allDay && i.startTime)
    .map((i) => {
      const start = minutesOf(i.startTime!);
      let end = i.endTime ? minutesOf(i.endTime) : start + 30;
      if (end <= start) end = 24 * 60; // termina no dia seguinte
      return { item: i, start, end: Math.max(end, start + 20), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: typeof timed = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    for (const c of cluster) c.lanes = lanes;
    cluster = [];
  };
  for (const ev of timed) {
    if (ev.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const used = new Set(cluster.filter((c) => c.end > ev.start).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    ev.lane = lane;
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  flush();
  return timed;
}

function useNowMinutes() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
      setNow(minutesOf(parts));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function AgendaView({
  locale,
  view,
  anchor,
  from,
  to,
  today,
  title,
  items,
  settings,
}: {
  locale: string;
  view: AgendaViewMode;
  anchor: string;
  from: string;
  to: string;
  today: string;
  title: string;
  items: AgendaItem[];
  settings: AgendaSettings;
}) {
  const [dialog, setDialog] = useState<EventDraft | null>(null);
  const base = `/${locale}/admin/agenda`;
  const step = view === "semana" ? 7 : view === "lista" ? 14 : 1;
  const href = (v: AgendaViewMode, d: string) => `${base}?visao=${v}&data=${d}`;
  const days = useMemo(() => Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i)), [from, to]);
  const writable = settings.calendars.filter((c) => c.writable);
  const visible = settings.calendars.filter((c) => c.visible);

  const openNew = (date: string, start?: string) =>
    setDialog({ mode: "new", date, start: start ?? "", allDay: !start, calendarId: settings.defaultId ?? writable[0]?.id ?? "" });
  const openItem = (i: AgendaItem) => {
    if (i.kind === "task") {
      window.location.href = `/${locale}/admin/tarefas`;
      return;
    }
    setDialog({ mode: "edit", item: i, date: i.date, start: i.startTime ?? "", allDay: i.allDay, calendarId: i.calendarId ?? "" });
  };

  return (
    <div className="flex w-full flex-col gap-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* No celular o mês aparece na faixa de dias; o título fica para leitores de tela. */}
          <h1 className="font-heading text-2xl font-semibold tracking-tight max-md:sr-only">{title}</h1>
          <nav aria-label="Período" className="flex md:ml-2">
            <Link href={href(view, addDays(anchor, -step))} aria-label="Anterior" className="grid size-9 place-items-center border outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60">
              <ChevronLeftIcon aria-hidden="true" className="size-3.5" />
            </Link>
            <Link href={href(view, today)} className="inline-flex h-9 items-center border border-l-0 px-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60">
              Hoje
            </Link>
            <Link href={href(view, addDays(anchor, step))} aria-label="Próximo" className="grid size-9 place-items-center border border-l-0 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60">
              <ChevronRightIcon aria-hidden="true" className="size-3.5" />
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <nav aria-label="Visão" className="flex border max-md:hidden">
            {(["dia", "semana", "lista"] as const).map((v) => (
              <Link
                key={v}
                href={href(v, anchor)}
                aria-current={view === v ? "page" : undefined}
                className={cn(
                  "inline-flex h-[34px] items-center px-3 capitalize outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
                  view === v ? "bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                {v}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => openNew(view === "semana" && from <= today && today <= to ? today : anchor)}
            disabled={writable.length === 0}
            className="inline-flex h-9 items-center gap-2 bg-primary px-3.5 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
          >
            <PlusIcon aria-hidden="true" className="size-3.5" />
            <span className="max-sm:sr-only">Novo evento</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {visible.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5">
            <span className="size-2.5" style={{ background: c.color }} aria-hidden="true" />
            {c.name}
          </span>
        ))}
        {settings.showTasks && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 border border-dashed border-muted-foreground" aria-hidden="true" />
            Tarefas com data
          </span>
        )}
        <Link href={`${base}/agendas`} className="ml-auto hover:text-foreground">
          Agendas conectadas →
        </Link>
      </div>

      {/* Celular: faixa da semana + lista. Desktop: grade (dia/semana) ou lista. */}
      <div className="md:hidden">
        <MobileStrip days={view === "semana" ? days : Array.from({ length: 7 }, (_, i) => addDays(anchor, i))} today={today} items={items} anchor={anchor} hrefFor={(d) => href(view === "semana" ? "semana" : "dia", d)} title={monthName(anchor)} />
        <AgendaList days={view === "dia" ? days : days.filter((d) => d >= today || view !== "semana")} today={today} items={items} onOpen={openItem} hideEmpty={view !== "dia"} idPrefix="m" />
      </div>
      <div className="max-md:hidden">
        {view === "lista" ? (
          <AgendaList days={days} today={today} items={items} onOpen={openItem} hideEmpty idPrefix="d" />
        ) : (
          <TimeGrid days={days} today={today} items={items} onOpen={openItem} onSlot={openNew} canCreate={writable.length > 0} />
        )}
      </div>

      <EventDialog draft={dialog} calendars={writable} onClose={() => setDialog(null)} />
    </div>
  );
}

function MobileStrip({
  days,
  today,
  items,
  anchor,
  hrefFor,
  title,
}: {
  days: string[];
  today: string;
  items: AgendaItem[];
  anchor: string;
  hrefFor: (d: string) => string;
  title: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2.5">
      <p className="font-heading text-lg font-semibold">{title}</p>
      <nav aria-label="Dias" className="grid grid-cols-7 gap-0.5">
        {days.map((d) => {
          const selected = d === anchor || (d === today && anchor !== d && !days.includes(anchor));
          const has = itemsOn(items, d).length > 0;
          return (
            <Link
              key={d}
              href={hrefFor(d)}
              aria-current={d === today ? "date" : undefined}
              className={cn(
                "flex h-[60px] flex-col items-center justify-center gap-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                selected ? "bg-foreground text-background" : d === today ? "bg-muted" : "hover:bg-muted",
              )}
            >
              <span className="text-[10px] uppercase opacity-75">{WEEKDAY_SHORT[new Date(`${d}T12:00:00Z`).getUTCDay()]}</span>
              <span className="font-heading text-base font-semibold">{Number(d.slice(8))}</span>
              <span className={cn("size-1 rounded-full", has ? (selected ? "bg-background" : "bg-muted-foreground") : "bg-transparent")} aria-hidden="true" />
              {has && <span className="sr-only">tem compromissos</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function AgendaList({
  days,
  today,
  items,
  onOpen,
  hideEmpty,
  idPrefix,
}: {
  idPrefix: string;
  days: string[];
  today: string;
  items: AgendaItem[];
  onOpen: (i: AgendaItem) => void;
  hideEmpty: boolean;
}) {
  const sections = days.map((d) => ({ day: d, items: itemsOn(items, d) })).filter((s) => !hideEmpty || s.items.length > 0 || s.day === today);
  if (sections.length === 0) return <p className="border border-dashed p-4 text-muted-foreground">Nada marcado neste período.</p>;
  return (
    <div className="flex flex-col gap-5">
      {sections.map((s) => (
        <section key={s.day} className="flex flex-col gap-2" aria-labelledby={`${idPrefix}-${s.day}`}>
          <h2 id={`${idPrefix}-${s.day}`} className={SECTION_TITLE}>
            {dayHeading(s.day, today)}
          </h2>
          {s.items.length === 0 ? (
            <p className="border border-dashed p-3 text-muted-foreground">Nada marcado.</p>
          ) : (
            <ul className="border">
              {s.items.map((i) => {
                const past = s.day < today;
                return (
                  <li key={`${i.kind}:${i.id}`} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onOpen(i)}
                      className={cn(
                        "grid min-h-14 w-full grid-cols-[56px_3px_minmax(0,1fr)] items-center gap-2.5 px-3 py-2 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
                        past && "opacity-60",
                      )}
                    >
                      <span className="flex flex-col text-[11px]">
                        <span className="font-semibold">{i.allDay ? "dia todo" : i.startTime}</span>
                        {!i.allDay && i.kind === "event" && i.endTime && <span className="text-muted-foreground">{i.endTime}</span>}
                      </span>
                      <span
                        className="self-stretch"
                        style={i.kind === "task" ? { borderLeft: "2px dashed var(--muted-foreground)" } : { background: i.color }}
                        aria-hidden="true"
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[13px] font-medium">{i.title}</span>
                        <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          {i.kind === "task" && <span>tarefa</span>}
                          {i.location && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPinIcon aria-hidden="true" className="size-3 shrink-0" />
                              <span className="truncate">{i.location}</span>
                            </span>
                          )}
                          {i.recurring && <RepeatIcon aria-label="repete" className="size-3" />}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function TimeGrid({
  days,
  today,
  items,
  onOpen,
  onSlot,
  canCreate,
}: {
  days: string[];
  today: string;
  items: AgendaItem[];
  onOpen: (i: AgendaItem) => void;
  onSlot: (date: string, start: string) => void;
  canCreate: boolean;
}) {
  const nowMin = useNowMinutes();
  const perDay = days.map((d) => ({ day: d, all: itemsOn(items, d), timed: layoutDay(itemsOn(items, d).filter((i) => i.date === d)) }));
  // 8h–20h, ampliando se houver evento fora disso.
  const first = Math.min(8, ...perDay.flatMap((p) => p.timed.map((t) => Math.floor(t.start / 60))));
  const last = Math.max(20, ...perDay.flatMap((p) => p.timed.map((t) => Math.ceil(t.end / 60))));
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto border">
      <div style={{ minWidth: days.length > 1 ? 860 : undefined }}>
        <div className="grid border-b" style={{ gridTemplateColumns: cols }}>
          <span />
          {days.map((d) => (
            <div key={d} className={cn("flex items-baseline gap-1.5 border-l px-2.5 py-2", d === today && "bg-muted")}>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{WEEKDAY_SHORT[new Date(`${d}T12:00:00Z`).getUTCDay()]}</span>
              <span className="font-heading text-lg font-semibold">{Number(d.slice(8))}</span>
            </div>
          ))}
        </div>
        <div className="grid min-h-[34px] border-b" style={{ gridTemplateColumns: cols }}>
          <span className="px-1.5 py-2 text-right text-[10px] text-muted-foreground">dia todo</span>
          {perDay.map((p) => (
            <div key={p.day} className="flex flex-col gap-0.5 border-l p-1">
              {p.all
                .filter((i) => i.allDay)
                .map((i) => (
                  <button key={`${i.kind}:${i.id}`} type="button" onClick={() => onOpen(i)} className="truncate px-1.5 py-0.5 text-left text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring/60" style={itemStyle(i)}>
                    {i.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: cols }}>
          <div className="flex flex-col">
            {hours.map((h) => (
              <span key={h} className="-translate-y-1.5 px-1.5 text-right text-[10px] text-muted-foreground" style={{ height: HOUR }}>
                {h}:00
              </span>
            ))}
          </div>
          {perDay.map((p) => (
            <div
              key={p.day}
              className={cn("relative border-l", p.day === today && "bg-foreground/[0.02]")}
              style={{
                height: hours.length * HOUR,
                backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px)",
                backgroundSize: `100% ${HOUR}px`,
              }}
              onClick={(e) => {
                if (!canCreate || e.target !== e.currentTarget) return;
                const y = e.nativeEvent.offsetY;
                const minutes = first * 60 + Math.floor(y / (HOUR / 2)) * 30;
                onSlot(p.day, `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
              }}
            >
              {p.timed.map(({ item: i, start, end, lane, lanes }) => (
                <button
                  key={`${i.kind}:${i.id}`}
                  type="button"
                  onClick={() => onOpen(i)}
                  className="absolute flex flex-col gap-px overflow-hidden px-1.5 py-1 text-left outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/60"
                  style={{
                    ...itemStyle(i),
                    top: ((start - first * 60) / 60) * HOUR + 1,
                    height: Math.max(((end - start) / 60) * HOUR - 2, 20),
                    left: `calc(${(lane / lanes) * 100}% + 3px)`,
                    width: `calc(${100 / lanes}% - 6px)`,
                  }}
                >
                  <span className="text-[11px] font-semibold leading-tight">{i.title}</span>
                  <span className="text-[10px] opacity-80">{timeLabel(i)}</span>
                </button>
              ))}
              {p.day === today && nowMin !== null && nowMin >= first * 60 && nowMin <= last * 60 && (
                <>
                  <span className="pointer-events-none absolute inset-x-0 h-0.5 bg-red-600 dark:bg-red-400" style={{ top: ((nowMin - first * 60) / 60) * HOUR }} aria-hidden="true" />
                  <span className="pointer-events-none absolute -left-1 size-2 rounded-full bg-red-600 dark:bg-red-400" style={{ top: ((nowMin - first * 60) / 60) * HOUR - 3 }} aria-hidden="true" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
