// Tipos de registro do log de manejo e o formato de `data` de cada um.
// Arquivo puro (sem dependências de servidor) — usado pela API e pela UI.

export const PET_LOG_TYPES = ["feeding", "weight", "shed", "water", "vet", "note"] as const;
export type PetLogType = (typeof PET_LOG_TYPES)[number];

export const PET_LOG_LABELS: Record<PetLogType, string> = {
  feeding: "Alimentação",
  weight: "Pesagem",
  shed: "Muda",
  water: "TPA",
  vet: "Veterinário",
  note: "Nota",
};

export const FEEDING_RESULTS = ["accepted", "refused", "regurgitated"] as const;
export type FeedingResult = (typeof FEEDING_RESULTS)[number];
export const FEEDING_RESULT_LABELS: Record<FeedingResult, string> = {
  accepted: "Comeu",
  refused: "Recusou",
  regurgitated: "Regurgitou",
};

export const PREY_STATES = ["frozen", "prekilled", "live"] as const;
export type PreyState = (typeof PREY_STATES)[number];
export const PREY_STATE_LABELS: Record<PreyState, string> = {
  frozen: "Descongelado",
  prekilled: "Pré-abatido",
  live: "Vivo",
};

export type PetLogData = {
  feeding: {
    result: FeedingResult;
    prey?: string;
    preySize?: string;
    preyWeightG?: number;
    preyState?: PreyState;
  };
  weight: { grams: number; lengthCm?: number };
  shed: { complete: boolean };
  water: Record<string, never>;
  vet: { reason?: string; costBRL?: number };
  note: { title?: string };
};

/** Campos comuns a qualquer `data`. `importedFrom` marca registros sem hora. */
type Meta = { importedFrom?: string };

export type PetLogDTO<T extends PetLogType = PetLogType> = {
  id: string;
  petId: string;
  type: T;
  occurredAt: string;
  data: PetLogData[T] & Meta;
  notes: string | null;
  createdAt: string;
};

export type PetDTO = {
  id: string;
  slug: string;
  name: string;
  species: string | null;
  morph: string | null;
  sex: string | null;
  hatchDate: string | null;
  acquiredDate: string | null;
  feedIntervalDays: number;
  waterIntervalDays: number;
  notes: string | null;
};

export const PET_SEX_LABELS: Record<string, string> = {
  male: "Macho",
  female: "Fêmea",
  unknown: "Indefinido",
};

// ── Validação ────────────────────────────────────────────────────────────────

function num(v: unknown, { min = 0, max = 1e6 } = {}): number | undefined {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

function str(v: unknown, maxLen = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, maxLen);
  return t === "" ? undefined : t;
}

function oneOf<T extends string>(v: unknown, values: readonly T[]): T | undefined {
  return typeof v === "string" && (values as readonly string[]).includes(v) ? (v as T) : undefined;
}

function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export type FieldErrors = Partial<Record<string, string>>;

/**
 * Normaliza o `data` recebido para o tipo informado. Em caso de campo
 * obrigatório ausente/inválido, devolve `errors` por campo (para a UI marcar).
 * `previous` preserva metadados como `importedFrom` ao editar.
 */
export function parseLogData(
  type: PetLogType,
  raw: unknown,
  previous?: Record<string, unknown>,
): { data: Record<string, unknown> } | { errors: FieldErrors } {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const meta = compact({ importedFrom: str(previous?.importedFrom, 40) });

  switch (type) {
    case "feeding": {
      const result = oneOf(d.result, FEEDING_RESULTS);
      if (!result) return { errors: { result: "Escolha o resultado." } };
      if (d.preyWeightG !== undefined && d.preyWeightG !== "" && num(d.preyWeightG, { max: 5000 }) === undefined) {
        return { errors: { preyWeightG: "Peso da presa inválido, ex.: 30" } };
      }
      return {
        data: compact({
          ...meta,
          result,
          prey: str(d.prey, 80),
          preySize: str(d.preySize, 40),
          preyWeightG: num(d.preyWeightG, { max: 5000 }),
          preyState: oneOf(d.preyState, PREY_STATES),
        }),
      };
    }
    case "weight": {
      const grams = num(d.grams, { min: 0.1, max: 20000 });
      if (grams === undefined) return { errors: { grams: "Informe o peso em gramas, ex.: 260" } };
      if (d.lengthCm !== undefined && d.lengthCm !== "" && num(d.lengthCm, { min: 1, max: 1000 }) === undefined) {
        return { errors: { lengthCm: "Comprimento inválido, ex.: 95" } };
      }
      return { data: compact({ ...meta, grams, lengthCm: num(d.lengthCm, { min: 1, max: 1000 }) }) };
    }
    case "shed":
      return { data: { ...meta, complete: d.complete !== false } };
    case "vet":
      return { data: compact({ ...meta, reason: str(d.reason, 200), costBRL: num(d.costBRL) }) };
    case "note":
      return { data: compact({ ...meta, title: str(d.title, 120) }) };
    case "water":
      return { data: meta };
  }
}
