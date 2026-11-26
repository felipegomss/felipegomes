"use client";

import type { ReactNode } from "react";
import {
  BrushIcon,
  DropletsIcon,
  EyeIcon,
  HandIcon,
  NotebookPenIcon,
  ScaleIcon,
  SparklesIcon,
  StethoscopeIcon,
  ThermometerIcon,
  ToiletIcon,
  UtensilsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLEANING_KIND_LABELS,
  FEEDING_RESULT_LABELS,
  PREY_STATE_LABELS,
  type PetLogData,
  type PetLogDTO,
  type PetLogType,
} from "@/lib/pets/types";

export const LOG_ICONS: Record<PetLogType, ReactNode> = {
  feeding: <UtensilsIcon />,
  shed: <SparklesIcon />,
  blue: <EyeIcon />,
  weight: <ScaleIcon />,
  poop: <ToiletIcon />,
  cleaning: <BrushIcon />,
  water: <DropletsIcon />,
  reading: <ThermometerIcon />,
  handling: <HandIcon />,
  vet: <StethoscopeIcon />,
  note: <NotebookPenIcon />,
};

export const LOG_TONES: Record<PetLogType, string> = {
  feeding: "text-amber-500 bg-amber-500/10",
  shed: "text-violet-500 bg-violet-500/10",
  blue: "text-sky-500 bg-sky-500/10",
  weight: "text-emerald-500 bg-emerald-500/10",
  poop: "text-orange-700 bg-orange-700/10 dark:text-orange-400 dark:bg-orange-400/10",
  cleaning: "text-teal-500 bg-teal-500/10",
  water: "text-blue-500 bg-blue-500/10",
  reading: "text-rose-500 bg-rose-500/10",
  handling: "text-fuchsia-500 bg-fuchsia-500/10",
  vet: "text-red-500 bg-red-500/10",
  note: "text-muted-foreground bg-muted",
};

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatDay(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_PT[date.getMonth()]}${sameYear ? "" : ` ${date.getFullYear()}`}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDay(d)} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "hoje", "ontem", "há 3 dias", "em 2 dias" */
export function relativeDays(days: number): string {
  if (days === 0) return "hoje";
  if (days === -1) return "ontem";
  if (days === 1) return "amanhã";
  if (days < 0) return `há ${-days} dias`;
  return `em ${days} dias`;
}

/** Valor para `<input type="datetime-local">` no fuso local. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fmtNum = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Linha-resumo de um registro, para o histórico. */
export function summarizeLog(log: PetLogDTO): string {
  switch (log.type) {
    case "feeding": {
      const d = log.data as PetLogData["feeding"];
      const prey = [d.prey, d.preySize].filter(Boolean).join(" ");
      const weight = d.preyWeightG ? `${fmtNum(d.preyWeightG)} g` : null;
      const state = d.preyState ? PREY_STATE_LABELS[d.preyState].toLowerCase() : null;
      return [FEEDING_RESULT_LABELS[d.result], prey || null, weight, state].filter(Boolean).join(" · ");
    }
    case "shed": {
      const d = log.data as PetLogData["shed"];
      return [d.complete ? "Completa" : "Incompleta", d.inOnePiece ? "inteira" : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "weight": {
      const d = log.data as PetLogData["weight"];
      return [`${fmtNum(d.grams)} g`, d.lengthCm ? `${fmtNum(d.lengthCm)} cm` : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "poop": {
      const d = log.data as PetLogData["poop"];
      return [
        d.normal === false ? "Anormal" : "Normal",
        d.urate === false ? "sem urato" : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "cleaning": {
      const d = log.data as PetLogData["cleaning"];
      return [CLEANING_KIND_LABELS[d.kind], d.substrateChanged ? "substrato trocado" : null]
        .filter(Boolean)
        .join(" · ");
    }
    case "reading": {
      const d = log.data as PetLogData["reading"];
      return [
        d.hot !== undefined ? `quente ${fmtNum(d.hot)}°C` : null,
        d.cold !== undefined ? `frio ${fmtNum(d.cold)}°C` : null,
        d.humidity !== undefined ? `umidade ${fmtNum(d.humidity)}%` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "handling": {
      const d = log.data as PetLogData["handling"];
      return d.minutes ? `${fmtNum(d.minutes)} min` : "";
    }
    case "vet": {
      const d = log.data as PetLogData["vet"];
      return [
        d.reason,
        d.costBRL
          ? d.costBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    default:
      return "";
  }
}

export { fmtNum };

/** Grupo de botões exclusivos (segmented control). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 border px-2.5 text-xs transition-colors",
            value === o.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-foreground"
      />
      {label}
    </label>
  );
}
