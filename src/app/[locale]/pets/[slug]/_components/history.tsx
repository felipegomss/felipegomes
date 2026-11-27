"use client";

import { useMemo, useState } from "react";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { dayKey, sortLogsDesc } from "@/lib/pets/stats";
import { PET_LOG_LABELS, PET_LOG_TYPES, type PetDTO, type PetLogDTO, type PetLogType } from "@/lib/pets/types";
import { LogRow } from "./dashboard";
import { LogDialog, type DialogTarget } from "./log-dialog";
import { LOG_ICON_COLOR, LOG_ICONS, monthTitle, lowerLabel } from "./shared";

const PAGE = 50;

export function PetHistory({ pet, logs }: { pet: PetDTO; logs: PetLogDTO[] }) {
  const [filter, setFilter] = useState<PetLogType | "all">("all");
  const [limit, setLimit] = useState(PAGE);
  const [target, setTarget] = useState<DialogTarget>(null);

  const sorted = useMemo(() => sortLogsDesc(logs), [logs]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(PET_LOG_TYPES.map((t) => [t, 0])) as Record<PetLogType, number>;
    for (const l of logs) c[l.type]++;
    return c;
  }, [logs]);
  const filtered = filter === "all" ? sorted : sorted.filter((l) => l.type === filter);
  const visible = filtered.slice(0, limit);

  const groups = useMemo(() => {
    const out: { key: string; title: string; items: PetLogDTO[] }[] = [];
    for (const log of visible) {
      const key = dayKey(log.occurredAt).slice(0, 7);
      if (out.at(-1)?.key !== key) out.push({ key, title: monthTitle(log.occurredAt), items: [] });
      out.at(-1)!.items.push(log);
    }
    return out;
  }, [visible]);

  const lastFeeding = sorted.find((l) => l.type === "feeding") ?? null;
  const filters: { value: PetLogType | "all"; label: string; count: number }[] = [
    { value: "all", label: "Todos", count: logs.length },
    ...PET_LOG_TYPES.map((t) => ({ value: t, label: PET_LOG_LABELS[t], count: counts[t] })),
  ];

  return (
    <div className="flex flex-col gap-5 text-xs">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Histórico</h1>
          <p className="text-muted-foreground">
            {logs.length} registros do {pet.name}
            <span className="max-md:hidden">, do mais recente ao mais antigo. Toque num registro para editar ou excluir</span>.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusIcon aria-hidden="true" />
              Registrar
              <ChevronDownIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {PET_LOG_TYPES.map((type) => (
              <DropdownMenuItem key={type} onSelect={() => setTarget({ type })} className="h-9 gap-2.5">
                <span aria-hidden="true" className={cn("[&>svg]:size-3.5", LOG_ICON_COLOR[type])}>
                  {LOG_ICONS[type]}
                </span>
                {PET_LOG_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div role="group" aria-label="Filtrar por tipo" className="flex gap-1 max-md:-mx-4 max-md:overflow-x-auto max-md:px-4 md:flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => {
              setFilter(f.value);
              setLimit(PAGE);
            }}
            className={cn(
              "h-9 shrink-0 border px-3 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 sm:h-8",
              filter === f.value
                ? "border-foreground bg-foreground font-medium text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label} · {f.count}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="border border-dashed p-4 text-muted-foreground">
          {filter === "all"
            ? "Nada registrado ainda."
            : `Nenhum registro de ${lowerLabel(PET_LOG_LABELS[filter as PetLogType])} ainda.`}
        </p>
      )}

      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2" aria-labelledby={`m-${g.key}`}>
          <h2 id={`m-${g.key}`} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {g.title}
          </h2>
          <ul className="border">
            {g.items.map((log) => (
              <li key={log.id} className="border-b last:border-b-0">
                <LogRow log={log} showDateFirst onOpen={() => setTarget({ type: log.type, editing: log })} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filtered.length > limit && (
        <Button variant="outline" size="lg" className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
          Carregar mais · {filtered.length - limit} restantes
        </Button>
      )}

      <LogDialog slug={pet.slug} target={target} onClose={() => setTarget(null)} lastFeeding={lastFeeding} />
    </div>
  );
}
