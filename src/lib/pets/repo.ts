import { and, desc, eq } from "drizzle-orm";
import { db, pets, petLogs, type Pet, type PetLog } from "@/lib/db/client";
import type { PetDTO, PetLogDTO, PetLogType } from "./types";

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
    waterIntervalDays: p.waterIntervalDays,
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

export async function getPet(slug: string): Promise<Pet | null> {
  const [found] = await db.select().from(pets).where(eq(pets.slug, slug)).limit(1);
  return found ?? null;
}

export async function listLogs(petId: string): Promise<PetLog[]> {
  return db
    .select()
    .from(petLogs)
    .where(eq(petLogs.petId, petId))
    .orderBy(desc(petLogs.occurredAt));
}

export async function getLog(petId: string, id: string): Promise<PetLog | null> {
  const [row] = await db
    .select()
    .from(petLogs)
    .where(and(eq(petLogs.petId, petId), eq(petLogs.id, id)))
    .limit(1);
  return row ?? null;
}

/** Pet + registros serializados, para as páginas server-side. */
export async function loadPetPage(slug: string): Promise<{ pet: PetDTO; logs: PetLogDTO[] } | null> {
  const pet = await getPet(slug);
  if (!pet) return null;
  const logs = await listLogs(pet.id);
  return { pet: toPetDTO(pet), logs: logs.map(toLogDTO) };
}
