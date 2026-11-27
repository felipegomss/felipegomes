"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import {
  DropletsIcon,
  NotebookPenIcon,
  ScaleIcon,
  SparklesIcon,
  StethoscopeIcon,
  UtensilsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PET_TZ } from "@/lib/pets/stats";
import { cleanDate, formatDay } from "@/lib/format-date";
import {
  FEEDING_RESULT_LABELS,
  PREY_STATE_LABELS,
  type PetLogData,
  type PetLogDTO,
  type PetLogType,
} from "@/lib/pets/types";

export const LOG_ICONS: Record<PetLogType, ReactNode> = {
  feeding: <UtensilsIcon />,
  weight: <ScaleIcon />,
  shed: <SparklesIcon />,
  water: <DropletsIcon />,
  vet: <StethoscopeIcon />,
  note: <NotebookPenIcon />,
};

// Cor só no ícone (o DS do site é neutro). Tons escolhidos para ≥3:1 sobre o
// fundo tingido nos dois temas.
export const LOG_TONES: Record<PetLogType, string> = {
  feeding: "text-amber-700 bg-amber-500/10 dark:text-amber-400",
  weight: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-400",
  shed: "text-violet-700 bg-violet-500/10 dark:text-violet-400",
  water: "text-blue-700 bg-blue-500/10 dark:text-blue-400",
  vet: "text-red-700 bg-red-500/10 dark:text-red-400",
  note: "text-muted-foreground bg-muted",
};

export const LOG_ICON_COLOR: Record<PetLogType, string> = {
  feeding: "text-amber-700 dark:text-amber-400",
  weight: "text-emerald-700 dark:text-emerald-400",
  shed: "text-violet-700 dark:text-violet-400",
  water: "text-blue-700 dark:text-blue-400",
  vet: "text-red-700 dark:text-red-400",
  note: "text-muted-foreground",
};

/** Badges de status — ≥4,5:1 nos dois temas (ver auditoria de acessibilidade). */
export const BADGE_TONES = {
  neutral: "bg-muted text-foreground",
  danger: "bg-red-500/10 text-red-800 dark:text-red-400",
  warn: "bg-amber-500/10 text-amber-800 dark:text-amber-400",
  ok: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={cn("inline-flex w-fit items-center px-2 py-0.5 text-[11px] font-medium min-[360px]:whitespace-nowrap", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function TypeIcon({ type, size = "md" }: { type: PetLogType; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center",
        size === "sm" ? "size-6 [&>svg]:size-3.5" : "size-7 [&>svg]:size-4",
        LOG_TONES[type],
      )}
    >
      {LOG_ICONS[type]}
    </span>
  );
}

// ── Datas (sempre no fuso de São Paulo) ─────────────────────────────────────

const dayYearFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: PET_TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: PET_TZ, hour: "2-digit", minute: "2-digit" });
const monthTitleFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: PET_TZ, month: "long", year: "numeric" });

const clean = cleanDate;
export { formatDay };

/** "06 mar 2024" a partir de "YYYY-MM-DD". */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return "—";
  return clean(dayYearFmt.format(new Date(`${iso}T12:00:00-03:00`)));
}

/** Data do registro; registros importados não têm hora. */
export function formatWhen(log: PetLogDTO): string {
  const day = formatDay(log.occurredAt);
  return log.data.importedFrom ? day : `${day} · ${timeFmt.format(new Date(log.occurredAt))}`;
}

/** "Novembro 2026" */
export function monthTitle(d: Date | string): string {
  const s = clean(monthTitleFmt.format(typeof d === "string" ? new Date(d) : d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Valor para `<input type="datetime-local">` no fuso do navegador. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Minúsculas para meio de frase, preservando siglas ("TPA"). */
export function lowerLabel(label: string): string {
  return label === label.toUpperCase() ? label : label.toLowerCase();
}

export const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function plural(n: number, one: string, many: string) {
  return `${n} ${Math.abs(n) === 1 ? one : many}`;
}

/** Linha-resumo de um registro, para listas. */
export function summarizeLog(log: PetLogDTO): string {
  switch (log.type) {
    case "feeding": {
      const d = log.data as PetLogData["feeding"];
      return [
        FEEDING_RESULT_LABELS[d.result],
        [d.prey, d.preySize].filter(Boolean).join(" ") || null,
        d.preyWeightG !== undefined ? `${fmtNum(d.preyWeightG)} g` : null,
        d.preyState ? PREY_STATE_LABELS[d.preyState].toLowerCase() : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "weight": {
      const d = log.data as PetLogData["weight"];
      return [`${fmtNum(d.grams)} g`, d.lengthCm ? `${fmtNum(d.lengthCm)} cm` : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "shed":
      return (log.data as PetLogData["shed"]).complete ? "Completa" : "Parcial";
    case "water":
      return log.notes || "Troca parcial de água";
    case "vet": {
      const d = log.data as PetLogData["vet"];
      return (
        [
          d.reason,
          d.costBRL !== undefined
            ? d.costBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : null,
        ]
          .filter(Boolean)
          .join(" · ") ||
        log.notes ||
        "Consulta"
      );
    }
    case "note": {
      const d = log.data as PetLogData["note"];
      return d.title || log.notes || "";
    }
  }
}

// ── Formulário ──────────────────────────────────────────────────────────────

/** Grupo de opções exclusivas, com setas do teclado (padrão ARIA radiogroup). */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  invalid,
  describedBy,
}: {
  label: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  invalid?: boolean;
  describedBy?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (current + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
      className="flex flex-wrap gap-1"
    >
      {options.map((o, i) => {
        const checked = value === o.value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={i === current ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-10 border px-3.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              checked
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
              invalid && !checked && "border-red-700 dark:border-red-400",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Classe da borda de input com contraste ≥3:1 (auditoria #2). */
export const INPUT_STRONG = "h-10 border-muted-foreground/70 dark:border-muted-foreground/70";

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <span id={id} role="alert" className="text-xs text-red-800 dark:text-red-400">
      {children}
    </span>
  );
}

export const LABEL = "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
export const SECTION_TITLE = "font-semibold text-xs uppercase tracking-[0.12em]";
