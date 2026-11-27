"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BotIcon, CalendarIcon, ChevronRightIcon, PencilIcon, PlusIcon, RepeatIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  dayLabel,
  dueLabel,
  groupTasks,
  repeatLabel,
  taskCounts,
  type TaskDTO,
  type TaskGroupId,
} from "@/lib/tasks/model";
import { TaskDialog } from "./task-dialog";

const SECTION_TITLE = "text-xs font-semibold uppercase tracking-[0.12em]";

const GROUP_TONE: Partial<Record<TaskGroupId, string>> = {
  overdue: "text-red-700 dark:text-red-400",
};
const DUE_TONE: Partial<Record<TaskGroupId, string>> = {
  overdue: "text-red-700 dark:text-red-400",
  today: "text-amber-700 dark:text-amber-400",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function TasksView({
  open,
  done,
  lists,
  today,
  focusAdd,
}: {
  open: TaskDTO[];
  done: TaskDTO[];
  lists: string[];
  today: string;
  focusAdd: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);
  // Conclusões otimistas: some/volta na hora, o servidor confirma depois.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [announce, setAnnounce] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "Nova tarefa" da home abre com o campo focado (depois que o layout monta).
  useEffect(() => {
    if (!focusAdd) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [focusAdd]);
  // Dados novos do servidor substituem o estado otimista.
  useEffect(() => setToggled({}), [open, done]);

  const isDone = (t: TaskDTO) => toggled[t.id] ?? !!t.completedAt;
  const visibleOpen = useMemo(
    () => [...open, ...done].filter((t) => !isDone(t) && (!filter || t.list === filter)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, done, filter, toggled],
  );
  const visibleDone = useMemo(
    () => [...done, ...open].filter((t) => isDone(t) && (!filter || t.list === filter)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, done, filter, toggled],
  );
  const groups = groupTasks(visibleOpen, today);
  const counts = taskCounts(open, today);
  const doneToday = done.filter((t) => t.completedAt && dayLabel(t.completedAt.slice(0, 10), today) === "hoje").length;

  const countByList = (l: string) => open.filter((t) => t.list === l).length;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || adding) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: value, ...(filter && !/#\S/.test(value) ? { list: filter } : {}) }),
    });
    setAdding(false);
    if (!res.ok) {
      setAddError((await res.json().catch(() => null))?.error ?? "Não foi possível adicionar.");
      return;
    }
    const { task } = (await res.json()) as { task: TaskDTO };
    setText("");
    setAnnounce(`Adicionada: ${task.title}${task.dueDate ? `, ${dueLabel(task, today)}` : ""}.`);
    startTransition(() => router.refresh());
  }

  async function toggle(t: TaskDTO, value: boolean) {
    setToggled((s) => ({ ...s, [t.id]: value }));
    setAnnounce(value ? `Concluída: ${t.title}.` : `Reaberta: ${t.title}.`);
    const res = await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: value }),
    });
    if (!res.ok) {
      setToggled((s) => ({ ...s, [t.id]: !value }));
      setAnnounce("Não foi possível salvar. Tente de novo.");
      return;
    }
    const { next } = (await res.json()) as { next: TaskDTO | null };
    if (next) setAnnounce(`Concluída: ${t.title}. Próxima: ${dueLabel(next, today)}.`);
    startTransition(() => router.refresh());
  }

  function newList() {
    setText((v) => `${v.trimEnd()}${v.trim() ? " " : ""}#`);
    inputRef.current?.focus();
  }

  const summary = [
    counts.today && `${counts.today} para hoje`,
    counts.overdue && plural(counts.overdue, "atrasada", "atrasadas"),
    doneToday && plural(doneToday, "concluída hoje", "concluídas hoje"),
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-xs">
      <section className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tarefas</h1>
        <p className="text-muted-foreground">{summary.length ? summary.join(" · ") : "Nada para hoje."}</p>
      </section>

      <form onSubmit={add} className="flex flex-col gap-1.5" aria-describedby="add-hint">
        <label htmlFor="quick-add" className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          Nova tarefa
        </label>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id="quick-add"
            autoFocus={focusAdd}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (addError) setAddError(null);
            }}
            placeholder="ex.: pagar a fatura sexta #casa"
            autoComplete="off"
            enterKeyHint="done"
            className="h-11 flex-1 text-[13px] max-sm:text-base"
            aria-invalid={!!addError || undefined}
          />
          <Button type="submit" size="lg" disabled={adding || !text.trim()} className="h-11 gap-2 px-4" aria-label="Adicionar tarefa">
            <PlusIcon aria-hidden="true" className="size-4" />
            <span className="max-sm:hidden">Adicionar</span>
          </Button>
        </div>
        {addError ? (
          <p role="alert" className="text-red-800 dark:text-red-400">
            {addError}
          </p>
        ) : (
          <p id="add-hint" className="text-[11px] text-muted-foreground">
            Entende “hoje”, “amanhã”, dia da semana, “dia 10”, 10/12, hora (“15h”), “toda seg e qua”, “todo mês” e #lista.
          </p>
        )}
      </form>

      <div role="group" aria-label="Filtrar por lista" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip pressed={filter === null} onClick={() => setFilter(null)}>
          Todas · {open.length}
        </Chip>
        {lists.map((l) => (
          <Chip key={l} pressed={filter === l} onClick={() => setFilter(filter === l ? null : l)}>
            {l} · {countByList(l)}
          </Chip>
        ))}
        <button
          type="button"
          onClick={newList}
          className="h-9 shrink-0 border border-dashed px-2.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          + lista
        </button>
      </div>

      {groups.length === 0 && (
        <p className="border border-dashed p-4 text-muted-foreground">
          {filter ? `Nada pendente em ${filter}.` : "Nada pendente. Adicione a primeira tarefa acima."}
        </p>
      )}

      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-2" aria-labelledby={`grp-${g.id}`}>
          <div className="flex items-baseline gap-2">
            <h2 id={`grp-${g.id}`} className={cn(SECTION_TITLE, GROUP_TONE[g.id])}>
              {g.title}
            </h2>
            <span className="text-[11px] text-muted-foreground">{g.tasks.length}</span>
          </div>
          <ul className="border">
            {g.tasks.map((t) => (
              <TaskRow key={t.id} task={t} group={g.id} today={today} done={false} onToggle={toggle} onEdit={setEditing} />
            ))}
          </ul>
        </section>
      ))}

      {visibleDone.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showDone}
            aria-controls="done-list"
            onClick={() => setShowDone((v) => !v)}
            className="inline-flex min-h-11 items-center gap-1.5 self-start text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronRightIcon aria-hidden="true" className={cn("size-3.5 transition-transform", showDone && "rotate-90")} />
            Concluídas · {doneToday ? `${doneToday} hoje, ` : ""}
            {visibleDone.length} nos últimos 30 dias
          </button>
          {showDone && (
            <ul id="done-list" className="border">
              {visibleDone.map((t) => (
                <TaskRow key={t.id} task={t} group="nodate" today={today} done onToggle={toggle} onEdit={setEditing} />
              ))}
            </ul>
          )}
        </section>
      )}

      <aside className="flex items-start gap-2.5 border border-dashed px-3.5 py-3 leading-relaxed text-muted-foreground">
        <BotIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Pelo Claude também: “me lembra de pagar a fatura sexta”, “o que tenho pra hoje?”, “marca a CNH como feita”.
          Tarefas criadas por agente ficam com o selo <span className="border px-1.5">agente</span>.
        </p>
      </aside>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <TaskDialog task={editing} lists={lists} today={today} onClose={() => setEditing(null)} />
    </div>
  );
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 border px-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
        pressed ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function TaskRow({
  task: t,
  group,
  today,
  done,
  onToggle,
  onEdit,
}: {
  task: TaskDTO;
  group: TaskGroupId;
  today: string;
  done: boolean;
  onToggle: (t: TaskDTO, v: boolean) => void;
  onEdit: (t: TaskDTO) => void;
}) {
  const due = done ? (t.completedAt ? `concluída ${dayLabel(t.completedAt.slice(0, 10), today)}` : null) : dueLabel(t, today);
  const repeat = repeatLabel(t);
  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center border-b last:border-b-0 sm:grid-cols-[44px_minmax(0,1fr)_auto_44px]">
      <label className="grid size-11 cursor-pointer place-items-center">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggle(t, e.target.checked)}
          aria-label={`${done ? "Reabrir" : "Concluir"}: ${t.title}`}
          className="size-[18px] cursor-pointer accent-foreground max-sm:size-5"
        />
      </label>
      <button
        type="button"
        onClick={() => onEdit(t)}
        aria-label={`${t.title}${due ? `, ${due}` : ""}${repeat ? `, repete ${repeat}` : ""}, lista ${t.list}. Editar`}
        className="flex min-w-0 flex-col gap-1 py-2.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 sm:pr-0"
      >
        <span className={cn("text-[13px] font-medium", done && "text-muted-foreground line-through")}>{t.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {due && (
            <span className={cn("inline-flex items-center gap-1", !done && DUE_TONE[group])}>
              <CalendarIcon aria-hidden="true" className="size-3" />
              {due}
            </span>
          )}
          {repeat && (
            <span className="inline-flex items-center gap-1">
              <RepeatIcon aria-hidden="true" className="size-3" />
              {repeat}
            </span>
          )}
          {t.notes && <span className="max-w-[28ch] truncate">{t.notes}</span>}
          <span className="sm:hidden">{t.list}</span>
          {t.via === "agent" && (
            <span className="inline-flex items-center gap-1 border px-1.5">
              <BotIcon aria-hidden="true" className="size-3" />
              agente
            </span>
          )}
        </span>
      </button>
      <span className="mr-2 border px-2 py-0.5 text-[11px] text-muted-foreground max-sm:hidden">{t.list}</span>
      <button
        type="button"
        onClick={() => onEdit(t)}
        tabIndex={-1}
        aria-hidden="true"
        className="grid size-11 place-items-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 max-sm:hidden"
      >
        <PencilIcon aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  );
}
