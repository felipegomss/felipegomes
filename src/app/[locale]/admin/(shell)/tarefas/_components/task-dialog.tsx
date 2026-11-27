"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  addDays,
  nextWeekday,
  weekdayOf,
  type TaskDTO,
  type TaskRepeat,
} from "@/lib/tasks/model";
import { LABEL, Segmented } from "../../../../pets/[slug]/_components/shared";

const REPEAT_OPTIONS: { value: TaskRepeat; label: string }[] = [
  { value: "none", label: "Não" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

const FIELD = "h-11 border-muted-foreground/70 dark:border-muted-foreground/70";

export function TaskDialog({
  task,
  lists,
  today,
  onClose,
}: {
  task: TaskDTO | null;
  lists: string[];
  today: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto text-xs sm:max-w-md">
        {task && <TaskForm key={task.id} task={task} lists={lists} today={today} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, lists, today, onClose }: { task: TaskDTO; lists: string[]; today: string; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task.dueTime ?? "");
  const [repeat, setRepeat] = useState<TaskRepeat>(task.repeat);
  const [days, setDays] = useState<number[]>(task.repeatDays ?? (task.dueDate ? [weekdayOf(task.dueDate)] : []));
  const [list, setList] = useState(task.list);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const shortcuts = [
    { label: "Hoje", value: today },
    { label: "Amanhã", value: addDays(today, 1) },
    { label: "Próx. segunda", value: nextWeekday(today, [1], false) },
    { label: "Sem data", value: "" },
  ];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Dê um nome à tarefa.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        dueDate: dueDate || null,
        dueTime: dueDate ? dueTime || null : null,
        repeat,
        repeatDays: repeat === "weekly" ? days : null,
        list: list.trim() || "Pessoal",
        notes,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Não foi possível salvar.");
      return;
    }
    onClose();
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Não foi possível excluir.");
      setConfirming(false);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Editar tarefa</DialogTitle>
        <DialogDescription className={task.via === "agent" ? "text-xs" : "sr-only"}>
          {task.via === "agent" ? "Criada por um agente (MCP)." : `Editar ${task.title}`}
        </DialogDescription>
      </DialogHeader>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Tarefa</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(FIELD, "text-[13px] max-sm:text-base")} aria-invalid={!title.trim() || undefined} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Data</span>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Hora (opcional)</span>
          <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={!dueDate} className={FIELD} />
        </label>
      </div>

      <div role="group" aria-label="Atalhos de data" className="-mt-1 flex flex-wrap gap-1.5">
        {shortcuts.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setDueDate(s.value);
              if (!s.value) setRepeat("none");
            }}
            aria-pressed={dueDate === s.value}
            className={cn(
              "h-8 border px-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
              dueDate === s.value ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Repetir</span>
        <Segmented
          label="Repetir"
          value={repeat}
          onChange={(v) => {
            setRepeat(v);
            if (v !== "none" && !dueDate) setDueDate(today);
            if (v === "weekly" && days.length === 0) setDays([weekdayOf(dueDate || today)]);
          }}
          options={REPEAT_OPTIONS}
        />
        {repeat === "weekly" && (
          <div role="group" aria-label="Dias da semana" className="mt-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => {
              const on = days.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays((cur) => (on ? cur.filter((x) => x !== d.value) : [...cur, d.value]))}
                  className={cn(
                    "h-9 border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                    on ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}
        {repeat !== "none" && (
          <p className="text-[11px] text-muted-foreground">Ao concluir, a próxima ocorrência é criada sozinha.</p>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Lista</span>
        <Input value={list} onChange={(e) => setList(e.target.value)} list="task-lists" className={FIELD} />
        <datalist id="task-lists">
          {lists.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Observações</span>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Opcional" className="border-muted-foreground/70" />
      </label>

      {error && (
        <p role="alert" className="text-red-800 dark:text-red-400">
          {error}
        </p>
      )}

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="task-del-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setConfirming(false);
            }
          }}
          className="flex flex-col gap-2.5 border border-red-500/40 bg-red-500/5 p-3"
        >
          <p id="task-del-title" className="font-semibold">
            Excluir “{task.title}”?
          </p>
          {task.repeat !== "none" && <p className="text-muted-foreground">Só esta ocorrência; as já concluídas ficam.</p>}
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="outline" size="lg" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={busy}
              onClick={remove}
              className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950 dark:hover:bg-red-300"
            >
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setConfirming(true)}
            className="gap-1.5 px-2 text-red-700 hover:text-red-800 dark:text-red-400"
          >
            <Trash2Icon aria-hidden="true" className="size-3.5" />
            Excluir
          </Button>
          <Button type="button" variant="outline" size="lg" className="ml-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={busy}>
            Salvar
          </Button>
        </div>
      )}
    </form>
  );
}
