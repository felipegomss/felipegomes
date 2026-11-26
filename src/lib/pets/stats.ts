// Indicadores derivados do log. Puro: roda tanto no servidor quanto no cliente.
import type { PetDTO, PetLogData, PetLogDTO, PetLogType } from "./types";

const DAY = 86_400_000;

export type PetStats = {
  feeding: {
    lastAccepted: PetLogDTO<"feeding"> | null;
    lastAttempt: PetLogDTO<"feeding"> | null;
    /** Recusas/regurgitações seguidas desde a última vez que comeu. */
    missStreak: number;
    nextDueAt: Date | null;
    /** Dias até a próxima (negativo = atrasada). */
    dueInDays: number | null;
    acceptedLast90d: number;
  };
  shed: {
    last: PetLogDTO<"shed"> | null;
    /** Média de dias entre mudas (null com menos de 2 registros). */
    avgIntervalDays: number | null;
    /** Olho azul registrado depois da última muda. */
    inBlue: PetLogDTO<"blue"> | null;
    nextEstimateAt: Date | null;
  };
  weight: {
    last: PetLogDTO<"weight"> | null;
    previous: PetLogDTO<"weight"> | null;
    series: { at: Date; grams: number }[];
  };
  last: Partial<Record<PetLogType, PetLogDTO>>;
};

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ofType<T extends PetLogType>(logs: PetLogDTO[], type: T): PetLogDTO<T>[] {
  return logs.filter((l): l is PetLogDTO<T> => l.type === type);
}

/** `logs` pode vir em qualquer ordem. */
export function computePetStats(pet: PetDTO, logs: PetLogDTO[], now = new Date()): PetStats {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const last: PetStats["last"] = {};
  for (const l of sorted) if (!last[l.type]) last[l.type] = l;

  // Alimentação
  const feedings = ofType(sorted, "feeding");
  const lastAccepted = feedings.find((f) => f.data.result === "accepted") ?? null;
  let missStreak = 0;
  for (const f of feedings) {
    if (f.data.result === "accepted") break;
    missStreak++;
  }
  // Depois de uma recusa, a próxima tentativa conta a partir da recusa.
  const anchor = feedings[0] ?? null;
  const nextDueAt = anchor
    ? new Date(new Date(anchor.occurredAt).getTime() + pet.feedIntervalDays * DAY)
    : null;
  const dueInDays = nextDueAt ? daysBetween(now, nextDueAt) : null;
  const acceptedLast90d = feedings.filter(
    (f) => f.data.result === "accepted" && now.getTime() - new Date(f.occurredAt).getTime() <= 90 * DAY,
  ).length;

  // Muda
  const sheds = ofType(sorted, "shed");
  const lastShed = sheds[0] ?? null;
  let avgIntervalDays: number | null = null;
  if (sheds.length >= 2) {
    const recent = sheds.slice(0, 6);
    let total = 0;
    for (let i = 0; i < recent.length - 1; i++) {
      total += daysBetween(new Date(recent[i + 1].occurredAt), new Date(recent[i].occurredAt));
    }
    avgIntervalDays = Math.round(total / (recent.length - 1));
  }
  const lastBlue = (last.blue as PetLogDTO<"blue"> | undefined) ?? null;
  const inBlue =
    lastBlue && (!lastShed || new Date(lastBlue.occurredAt) > new Date(lastShed.occurredAt))
      ? lastBlue
      : null;
  const nextEstimateAt =
    lastShed && avgIntervalDays
      ? new Date(new Date(lastShed.occurredAt).getTime() + avgIntervalDays * DAY)
      : null;

  // Peso
  const weights = ofType(sorted, "weight");
  const series = weights
    .map((w) => ({ at: new Date(w.occurredAt), grams: (w.data as PetLogData["weight"]).grams }))
    .reverse();

  return {
    feeding: {
      lastAccepted,
      lastAttempt: anchor,
      missStreak,
      nextDueAt,
      dueInDays,
      acceptedLast90d,
    },
    shed: { last: lastShed, avgIntervalDays, inBlue, nextEstimateAt },
    weight: { last: weights[0] ?? null, previous: weights[1] ?? null, series },
    last,
  };
}

/** Idade legível a partir de uma data `YYYY-MM-DD`. */
export function formatAge(isoDate: string | null, now = new Date()): string | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) return null;
  if (months < 1) return `${daysBetween(birth, now)} dias`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} ${rest === 1 ? "mês" : "meses"}`;
  if (rest === 0) return `${years} ${years === 1 ? "ano" : "anos"}`;
  return `${years}a ${rest}m`;
}
