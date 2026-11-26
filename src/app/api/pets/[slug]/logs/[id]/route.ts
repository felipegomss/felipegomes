import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, petLogs } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth";
import { getLog, getPet, toLogDTO } from "@/lib/pets/repo";
import { parseLogData, type PetLogType } from "@/lib/pets/types";

type Ctx = { params: Promise<{ slug: string; id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolve(params: Ctx["params"]) {
  const { slug, id } = await params;
  if (!UUID_RE.test(id)) return null;
  const pet = await getPet(slug);
  if (!pet) return null;
  const log = await getLog(pet.id, id);
  return log ? { pet, log } : null;
}

type PatchBody = { occurredAt?: string; data?: unknown; notes?: string | null };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await resolve(params);
  if (!found) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const updates: Partial<typeof petLogs.$inferInsert> = {};

  if (body.occurredAt !== undefined) {
    const d = new Date(body.occurredAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    updates.occurredAt = d;
  }
  if (body.data !== undefined) {
    const parsed = parseLogData(found.log.type as PetLogType, body.data);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    updates.data = parsed.data;
  }
  if (body.notes !== undefined) {
    updates.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada a atualizar." }, { status: 400 });
  }

  const [updated] = await db
    .update(petLogs)
    .set(updates)
    .where(and(eq(petLogs.id, found.log.id), eq(petLogs.petId, found.pet.id)))
    .returning();

  return NextResponse.json({ log: toLogDTO(updated) });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await resolve(params);
  if (!found) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  await db.delete(petLogs).where(eq(petLogs.id, found.log.id));
  return NextResponse.json({ ok: true });
}
