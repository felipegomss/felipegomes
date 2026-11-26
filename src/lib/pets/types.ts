// Tipos de evento do log de manejo e o formato de `data` de cada um.
// Arquivo puro (sem dependências de servidor) — usado pela API e pela UI.

export const PET_LOG_TYPES = [
  "feeding",
  "shed",
  "blue",
  "weight",
  "poop",
  "cleaning",
  "water",
  "reading",
  "handling",
  "vet",
  "note",
] as const;
export type PetLogType = (typeof PET_LOG_TYPES)[number];

export const PET_LOG_LABELS: Record<PetLogType, string> = {
  feeding: "Alimentação",
  shed: "Muda",
  blue: "Pré-muda (olho azul)",
  weight: "Pesagem",
  poop: "Fezes",
  cleaning: "Limpeza",
  water: "Troca de água",
  reading: "Temperatura / umidade",
  handling: "Manuseio",
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
  frozen: "Congelado/descongelado",
  prekilled: "Pré-abatido",
  live: "Vivo",
};

export const CLEANING_KINDS = ["spot", "full"] as const;
export type CleaningKind = (typeof CLEANING_KINDS)[number];
export const CLEANING_KIND_LABELS: Record<CleaningKind, string> = {
  spot: "Pontual",
  full: "Completa",
};

export type PetLogData = {
  feeding: {
    prey?: string;
    preySize?: string;
    preyWeightG?: number;
    preyState?: PreyState;
    result: FeedingResult;
  };
  shed: { complete: boolean; inOnePiece?: boolean };
  blue: Record<string, never>;
  weight: { grams: number; lengthCm?: number };
  poop: { urate?: boolean; normal?: boolean };
  cleaning: { kind: CleaningKind; substrateChanged?: boolean };
  water: Record<string, never>;
  reading: { hot?: number; cold?: number; humidity?: number };
  handling: { minutes?: number };
  vet: { reason?: string; costBRL?: number };
  note: Record<string, never>;
};

export type PetLogDTO<T extends PetLogType = PetLogType> = {
  id: string;
  petId: string;
  type: T;
  occurredAt: string;
  data: PetLogData[T];
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
  tempHotTarget: number | null;
  tempColdTarget: number | null;
  humidityTarget: number | null;
  notes: string | null;
};

export const PET_SEXES = ["male", "female", "unknown"] as const;
export const PET_SEX_LABELS: Record<(typeof PET_SEXES)[number], string> = {
  male: "Macho",
  female: "Fêmea",
  unknown: "Indefinido",
};

// ── Validação ────────────────────────────────────────────────────────────────

function num(v: unknown, { min = 0, max = 1e6 } = {}): number | undefined {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

function str(v: unknown, maxLen = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, maxLen);
  return t === "" ? undefined : t;
}

function bool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function oneOf<T extends string>(v: unknown, values: readonly T[]): T | undefined {
  return typeof v === "string" && (values as readonly string[]).includes(v) ? (v as T) : undefined;
}

function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Normaliza o `data` recebido para o tipo informado. Retorna `{ error }` quando
 * um campo obrigatório está ausente/inválido.
 */
export function parseLogData(
  type: PetLogType,
  raw: unknown,
): { data: PetLogData[PetLogType] } | { error: string } {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  switch (type) {
    case "feeding": {
      const result = oneOf(d.result, FEEDING_RESULTS);
      if (!result) return { error: "Resultado da alimentação inválido." };
      return {
        data: compact({
          result,
          prey: str(d.prey, 80),
          preySize: str(d.preySize, 40),
          preyWeightG: num(d.preyWeightG, { max: 5000 }),
          preyState: oneOf(d.preyState, PREY_STATES),
        }),
      };
    }
    case "shed":
      return {
        data: compact({ complete: bool(d.complete) ?? true, inOnePiece: bool(d.inOnePiece) }),
      };
    case "weight": {
      const grams = num(d.grams, { min: 0.1, max: 20000 });
      if (grams === undefined) return { error: "Peso inválido." };
      return { data: compact({ grams, lengthCm: num(d.lengthCm, { min: 1, max: 1000 }) }) };
    }
    case "poop":
      return { data: compact({ urate: bool(d.urate), normal: bool(d.normal) }) };
    case "cleaning":
      return {
        data: compact({
          kind: oneOf(d.kind, CLEANING_KINDS) ?? "spot",
          substrateChanged: bool(d.substrateChanged),
        }),
      };
    case "reading": {
      const data = compact({
        hot: num(d.hot, { min: -10, max: 80 }),
        cold: num(d.cold, { min: -10, max: 80 }),
        humidity: num(d.humidity, { min: 0, max: 100 }),
      });
      if (Object.keys(data).length === 0) return { error: "Informe ao menos uma leitura." };
      return { data };
    }
    case "handling":
      return { data: compact({ minutes: num(d.minutes, { max: 600 }) }) };
    case "vet":
      return { data: compact({ reason: str(d.reason, 200), costBRL: num(d.costBRL, { max: 1e6 }) }) };
    case "blue":
    case "water":
    case "note":
      return { data: {} };
  }
}

/** Normaliza o corpo de atualização de perfil. Campos ausentes ficam de fora. */
export function parsePetPatch(raw: unknown): Partial<Omit<PetDTO, "id" | "slug">> {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<Omit<PetDTO, "id" | "slug">> = {};
  const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const nullableStr = (k: "species" | "morph" | "notes", max: number) => {
    if (k in d) out[k] = str(d[k], max) ?? null;
  };

  if ("name" in d) {
    const name = str(d.name, 60);
    if (name) out.name = name;
  }
  nullableStr("species", 120);
  nullableStr("morph", 120);
  nullableStr("notes", 4000);
  if ("sex" in d) out.sex = oneOf(d.sex, PET_SEXES) ?? null;
  if ("hatchDate" in d) out.hatchDate = isDate(d.hatchDate) ? (d.hatchDate as string) : null;
  if ("acquiredDate" in d) out.acquiredDate = isDate(d.acquiredDate) ? (d.acquiredDate as string) : null;
  if ("feedIntervalDays" in d) {
    const n = num(d.feedIntervalDays, { min: 1, max: 90 });
    if (n !== undefined) out.feedIntervalDays = Math.round(n);
  }
  if ("tempHotTarget" in d) out.tempHotTarget = num(d.tempHotTarget, { min: -10, max: 80 }) ?? null;
  if ("tempColdTarget" in d) out.tempColdTarget = num(d.tempColdTarget, { min: -10, max: 80 }) ?? null;
  if ("humidityTarget" in d) out.humidityTarget = num(d.humidityTarget, { max: 100 }) ?? null;
  return out;
}
