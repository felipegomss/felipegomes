import { and, desc, eq } from "drizzle-orm";
import { db, pets, petLogs, type Pet, type PetLog } from "@/lib/db/client";
import type { PetDTO, PetLogDTO, PetLogType } from "./types";

// Perfis criados automaticamente no primeiro acesso.
const DEFAULT_PETS: Record<string, Omit<typeof pets.$inferInsert, "slug">> = {
  jorgin: {
    name: "Jorgin",
    species: "Lampropeltis (kingsnake)",
    feedIntervalDays: 10,
    tempHotTarget: 30,
    tempColdTarget: 24,
    humidityTarget: 50,
  },
};

export function toPetDTO(p: Pet): PetDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    species: p.species,
    morph: p.morph,
    sex: p.sex,
    hatchDate: p.hatchDate,
    acquiredDate: p.acquiredDate,
    feedIntervalDays: p.feedIntervalDays,
    tempHotTarget: p.tempHotTarget,
    tempColdTarget: p.tempColdTarget,
    humidityTarget: p.humidityTarget,
    notes: p.notes,
  };
}

export function toLogDTO(l: PetLog): PetLogDTO {
  return {
    id: l.id,
    petId: l.petId,
    type: l.type as PetLogType,
    occurredAt: l.occurredAt.toISOString(),
    data: (l.data ?? {}) as PetLogDTO["data"],
    notes: l.notes,
    createdAt: l.createdAt.toISOString(),
  };
}

/** Busca o pet pelo slug; cria com os defaults se for um slug conhecido. */
export async function getPet(slug: string): Promise<Pet | null> {
  const [found] = await db.select().from(pets).where(eq(pets.slug, slug)).limit(1);
  if (found) return found;

  const defaults = DEFAULT_PETS[slug];
  if (!defaults) return null;

  await db.insert(pets).values({ slug, ...defaults }).onConflictDoNothing();
  const [created] = await db.select().from(pets).where(eq(pets.slug, slug)).limit(1);
  return created ?? null;
}

export async function listLogs(petId: string, limit = 2000): Promise<PetLog[]> {
  return db
    .select()
    .from(petLogs)
    .where(eq(petLogs.petId, petId))
    .orderBy(desc(petLogs.occurredAt))
    .limit(limit);
}

export async function getLog(petId: string, id: string): Promise<PetLog | null> {
  const [row] = await db
    .select()
    .from(petLogs)
    .where(and(eq(petLogs.petId, petId), eq(petLogs.id, id)))
    .limit(1);
  return row ?? null;
}
