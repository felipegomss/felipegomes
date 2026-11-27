"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { minutesOf, type AgendaItem, type CalendarInfo } from "@/lib/calendar/model";
import { LABEL } from "../../../../pets/[slug]/_components/shared";

export type EventDraft = {
  mode: "new" | "edit";
  item?: AgendaItem;
  date: string;
  start: string;
  allDay: boolean;
  calendarId: string;
};

const FIELD = "h-11 border-muted-foreground/70 dark:border-muted-foreground/70";

const plusHour = (hm: string) => {
  const m = Math.min(minutesOf(hm) + 60, 23 * 60 + 59);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export function EventDialog({ draft, calendars, onClose }: { draft: EventDraft | null; calendars: CalendarInfo[]; onClose: () => void }) {
  return (
    <Dialog open={!!draft} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto text-xs sm:max-w-md">
        {draft && <EventForm key={`${draft.mode}:${draft.item?.id ?? draft.date + draft.start}`} draft={draft} calendars={calendars} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EventForm({ draft, calendars, onClose }: { draft: EventDraft; calendars: CalendarInfo[]; onClose: () => void }) {
  const router = useRouter();
  const it = draft.item;
  const editing = draft.mode === "edit" && !!it;
  const [title, setTitle] = useState(it?.title === "(sem título)" ? "" : (it?.title ?? ""));
  const [allDay, setAllDay] = useState(draft.allDay);
  const [date, setDate] = useState(draft.date);
  const [start, setStart] = useState(draft.start || "09:00");
  const [end, setEnd] = useState(it?.endTime ?? plusHour(draft.start || "09:00"));
  const [calendarId, setCalendarId] = useState(draft.calendarId);
  const [location, setLocation] = useState(it?.location ?? "");
  const [description, setDescription] = useState(it?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const calendar = calendars.find((c) => c.id === calendarId);
  const readOnly = editing && !calendar;

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Dê um título ao evento.");
    setBusy(true);
    setError(null);
    const body = {
      title,
      date,
      allDay,
      ...(allDay ? {} : { start, end }),
      location,
      description,
      ...(editing ? {} : { calendarId }),
    };
    const res = await fetch(editing ? `/api/calendar/events/${encodeURIComponent(it!.id)}?calendarId=${encodeURIComponent(it!.calendarId ?? "")}` : "/api/calendar/events", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? "Não foi possível salvar.");
    onClose();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/calendar/events/${encodeURIComponent(it!.id)}?calendarId=${encodeURIComponent(it!.calendarId ?? "")}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setConfirming(false);
      return setError((await res.json().catch(() => null))?.error ?? "Não foi possível excluir.");
    }
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar evento" : "Novo evento"}</DialogTitle>
        <DialogDescription className={it?.recurring || readOnly ? "text-xs" : "sr-only"}>
          {readOnly
            ? "Esta agenda é só de leitura."
            : it?.recurring
              ? "Evento que se repete: as mudanças valem só para esta ocorrência."
              : editing
                ? `Editar ${it?.title}`
                : "Criar um evento no Google Agenda"}
        </DialogDescription>
      </DialogHeader>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Título</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={!editing} disabled={readOnly} className={cn(FIELD, "text-[13px] max-sm:text-base")} />
      </label>

      <label className="flex min-h-8 cursor-pointer items-center gap-2.5">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} disabled={readOnly} className="size-[18px] accent-foreground" />
        Dia inteiro
      </label>

      <div className={cn("grid gap-3", allDay ? "grid-cols-1" : "grid-cols-3")}>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Data</span>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={readOnly} className={FIELD} />
        </label>
        {!allDay && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Início</span>
              <Input
                type="time"
                value={start}
                onChange={(e) => {
                  const v = e.target.value;
                  // Mantém a duração ao mudar o início.
                  if (v && start && end) {
                    const dur = minutesOf(end) - minutesOf(start);
                    if (dur > 0) {
                      const m = Math.min(minutesOf(v) + dur, 23 * 60 + 59);
                      setEnd(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
                    }
                  }
                  setStart(v);
                }}
                disabled={readOnly}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Fim</span>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={readOnly} className={FIELD} />
            </label>
          </>
        )}
      </div>

      {!editing && calendars.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className={LABEL} id="ev-cal">
            Agenda
          </span>
          <div role="radiogroup" aria-labelledby="ev-cal" className="grid grid-cols-2 gap-1.5">
            {calendars.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={calendarId === c.id}
                onClick={() => setCalendarId(c.id)}
                className={cn(
                  "flex h-10 items-center gap-2 border px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  calendarId === c.id ? "border-foreground" : "hover:bg-muted",
                )}
              >
                <span className="size-2.5 shrink-0" style={{ background: c.color }} aria-hidden="true" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {editing && calendar && (
        <p className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5" style={{ background: calendar.color }} aria-hidden="true" />
          {calendar.name}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Local (opcional)</span>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} disabled={readOnly} className={FIELD} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Descrição (opcional)</span>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={readOnly} className="border-muted-foreground/70" />
      </label>

      {error && (
        <p role="alert" className="text-red-800 dark:text-red-400">
          {error}
        </p>
      )}

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="ev-del"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setConfirming(false);
            }
          }}
          className="flex flex-col gap-2.5 border border-red-500/40 bg-red-500/5 p-3"
        >
          <p id="ev-del" className="font-semibold">
            Excluir “{it?.title}” do Google Agenda?
          </p>
          {it?.recurring && <p className="text-muted-foreground">Só esta ocorrência.</p>}
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="outline" size="lg" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" size="lg" disabled={busy} onClick={remove} className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950 dark:hover:bg-red-300">
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {editing && it?.link && (
            <a href={it.link} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground">
              Abrir no Google
              <ExternalLinkIcon aria-hidden="true" className="size-3" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          )}
          {editing && !readOnly && (
            <Button type="button" variant="ghost" size="lg" onClick={() => setConfirming(true)} className="gap-1.5 px-2 text-red-700 hover:text-red-800 dark:text-red-400">
              <Trash2Icon aria-hidden="true" className="size-3.5" />
              Excluir
            </Button>
          )}
          <Button type="button" variant="outline" size="lg" className="ml-auto" onClick={onClose}>
            {readOnly ? "Fechar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button type="submit" size="lg" disabled={busy}>
              {editing ? "Salvar" : "Criar evento"}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
