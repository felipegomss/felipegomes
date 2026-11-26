// Indicadores derivados do log. Puro: roda no servidor e no cliente.
// Todas as contas de "dia" usam o fuso de São Paulo, para o servidor (UTC) e o
// navegador chegarem ao mesmo número.
import type { PetDTO, PetLogDTO, PetLogType } from "./types";

export const PET_TZ = "America/Sao_Paulo";
const DAY = 86_400_000;

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: PET_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" do instante no fuso de São Paulo. */
export function dayKey(d: Date | string): string {
  return dayKeyFmt.format(typeof d === "string" ? new Date(d) : d);
}

function dayNumber(d: Date | string): number {
  const [y, m, day] = dayKey(d).split("-").map(Number);
  return Date.UTC(y, m - 1, day) / DAY;
}

/** Dias de calendário de `a` até `b` (positivo se `b` depois de `a`). */
export function daysBetween(a: Date | string, b: Date | string): number {
  return dayNumber(b) - dayNumber(a);
}

function addDays(d: Date | string, days: number): Date {
  return new Date(new Date(d).getTime() + days * DAY);
}

export type DueInfo = {
  last: PetLogDTO | null;
  /** Dias desde o último registro. */
  daysSince: number | null;
  nextAt: Date | null;
  /** Dias até o próximo (negativo = atrasado). */
  dueInDays: number | null;
};

export type PetStats = {
  feeding: DueInfo & {
    lastAccepted: PetLogDTO<"feeding"> | null;
    /** Últimas ofertas, da mais antiga para a mais recente. */
    recent: PetLogDTO<"feeding">[];
  };
  weight: {
    last: PetLogDTO<"weight"> | null;
    previous: PetLogDTO<"weight"> | null;
    daysSince: number | null;
    /** Ordem cronológica. */
    series: { at: string; grams: number }[];
  };
  shed: {
    last: PetLogDTO<"shed"> | null;
    daysSince: number | null;
    avgIntervalDays: number | null;
    nextEstimateAt: Date | null;
  };
  water: DueInfo;
  counts: Record<PetLogType, number>;
};

function ofType<T extends PetLogType>(logs: PetLogDTO[], type: T): PetLogDTO<T>[] {
  return logs.filter((l): l is PetLogDTO<T> => l.type === type);
}

export function sortLogsDesc(logs: PetLogDTO[]): PetLogDTO[] {
  return [...logs].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

function due(last: PetLogDTO | null, intervalDays: number, now: Date): DueInfo {
  if (!last) return { last: null, daysSince: null, nextAt: null, dueInDays: null };
  const nextAt = addDays(last.occurredAt, intervalDays);
  return {
    last,
    daysSince: daysBetween(last.occurredAt, now),
    nextAt,
    dueInDays: daysBetween(now, nextAt),
  };
}

export function computePetStats(pet: PetDTO, logs: PetLogDTO[], now = new Date()): PetStats {
  const sorted = sortLogsDesc(logs);

  // Alimentação: a próxima conta a partir da última que ele COMEU.
  const feedings = ofType(sorted, "feeding");
  const lastAccepted = feedings.find((f) => f.data.result === "accepted") ?? null;
  const feeding = {
    ...due(lastAccepted, pet.feedIntervalDays, now),
    lastAccepted,
    recent: feedings.slice(0, 8).reverse(),
  };

  // Peso
  const weights = ofType(sorted, "weight");
  const weight = {
    last: weights[0] ?? null,
    previous: weights[1] ?? null,
    daysSince: weights[0] ? daysBetween(weights[0].occurredAt, now) : null,
    series: weights.map((w) => ({ at: w.occurredAt, grams: w.data.grams })).reverse(),
  };

  // Muda: média dos últimos intervalos (até 5).
  const sheds = ofType(sorted, "shed");
  let avgIntervalDays: number | null = null;
  if (sheds.length >= 2) {
    const recent = sheds.slice(0, 6);
    let total = 0;
    for (let i = 0; i < recent.length - 1; i++) {
      total += daysBetween(recent[i + 1].occurredAt, recent[i].occurredAt);
    }
    avgIntervalDays = Math.round(total / (recent.length - 1));
  }
  const lastShed = sheds[0] ?? null;
  const shed = {
    last: lastShed,
    daysSince: lastShed ? daysBetween(lastShed.occurredAt, now) : null,
    avgIntervalDays,
    nextEstimateAt: lastShed && avgIntervalDays ? addDays(lastShed.occurredAt, avgIntervalDays) : null,
  };

  const water = due(ofType(sorted, "water")[0] ?? null, pet.waterIntervalDays, now);

  const counts = { feeding: 0, weight: 0, shed: 0, water: 0, vet: 0, note: 0 } as Record<PetLogType, number>;
  for (const l of logs) counts[l.type]++;

  return { feeding, weight, shed, water, counts };
}

/** "2 anos e 8 meses" a partir de "YYYY-MM-DD". */
export function formatAge(isoDate: string | null, now = new Date()): string | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const [ny, nm, nd] = dayKey(now).split("-").map(Number);
  let months = (ny - y) * 12 + (nm - m);
  if (nd < d) months--;
  if (months < 0) return null;
  if (months < 1) return `${daysBetween(`${isoDate}T12:00:00-03:00`, now)} dias`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yLabel = `${years} ${years === 1 ? "ano" : "anos"}`;
  const mLabel = `${rest} ${rest === 1 ? "mês" : "meses"}`;
  if (years === 0) return mLabel;
  if (rest === 0) return yLabel;
  return `${yLabel} e ${mLabel}`;
}
