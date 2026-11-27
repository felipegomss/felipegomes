// Ações sobre o log dos pets, compartilhadas pelas rotas do app e pelo MCP.
import { and, eq } from "drizzle-orm";
import { db, petLogs } from "@/lib/db/client";
import { getLog, getPet, toLogDTO } from "./repo";
import { PET_LOG_TYPES, parseLogData, type FieldErrors, type PetLogDTO, type PetLogType } from "./types";

export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 404; error: string; fields?: FieldErrors };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status: 400 | 404, error: string, fields?: FieldErrors) => ({ ok: false as const, status, error, fields });

function parseDate(v: unknown): Date | null | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

const cleanNotes = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 4000) || null : null);

export async function createPetLog(input: {
  slug: string;
  type: string;
  occurredAt?: unknown;
  data?: unknown;
  notes?: unknown;
  via?: "agent";
}): Promise<ActionResult<PetLogDTO>> {
  const pet = await getPet(input.slug);
  if (!pet) return fail(404, "Pet não encontrado.");
  if (!(PET_LOG_TYPES as readonly string[]).includes(input.type)) return fail(400, "Tipo inválido.");
  const type = input.type as PetLogType;

  const occurredAt = parseDate(input.occurredAt);
  if (occurredAt === null) return fail(400, "Data inválida.");

  const parsed = parseLogData(type, input.data, input.via ? { via: input.via } : undefined);
  if ("errors" in parsed) return fail(400, "Campos inválidos.", parsed.errors);

  const [created] = await db
    .insert(petLogs)
    .values({ petId: pet.id, type, occurredAt: occurredAt ?? new Date(), data: parsed.data, notes: cleanNotes(input.notes) })
    .returning();
  return { ok: true, value: toLogDTO(created) };
}

async function resolve(slug: string, id: string) {
  if (!UUID_RE.test(id)) return null;
  const pet = await getPet(slug);
  if (!pet) return null;
  const log = await getLog(pet.id, id);
  return log ? { pet, log } : null;
}

export async function updatePetLog(input: {
  slug: string;
  id: string;
  occurredAt?: unknown;
  data?: unknown;
  notes?: unknown;
}): Promise<ActionResult<PetLogDTO>> {
  const found = await resolve(input.slug, input.id);
  if (!found) return fail(404, "Registro não encontrado.");

  const updates: Partial<typeof petLogs.$inferInsert> = {};
  const occurredAt = parseDate(input.occurredAt);
  if (occurredAt === null) return fail(400, "Data inválida.");
  if (occurredAt) updates.occurredAt = occurredAt;
  if (input.data !== undefined) {
    const parsed = parseLogData(found.log.type as PetLogType, input.data, found.log.data as Record<string, unknown>);
    if ("errors" in parsed) return fail(400, "Campos inválidos.", parsed.errors);
    updates.data = parsed.data;
  }
  if (input.notes !== undefined) updates.notes = cleanNotes(input.notes);
  if (Object.keys(updates).length === 0) return fail(400, "Nada a atualizar.");

  const [updated] = await db
    .update(petLogs)
    .set(updates)
    .where(and(eq(petLogs.id, found.log.id), eq(petLogs.petId, found.pet.id)))
    .returning();
  return { ok: true, value: toLogDTO(updated) };
}

export async function deletePetLog(slug: string, id: string): Promise<ActionResult<{ id: string }>> {
  const found = await resolve(slug, id);
  if (!found) return fail(404, "Registro não encontrado.");
  await db.delete(petLogs).where(eq(petLogs.id, found.log.id));
  return { ok: true, value: { id } };
}
