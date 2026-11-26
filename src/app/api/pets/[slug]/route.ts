import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, pets } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth";
import { getPet, listLogs, toLogDTO, toPetDTO } from "@/lib/pets/repo";
import { parsePetPatch } from "@/lib/pets/types";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const pet = await getPet(slug);
  if (!pet) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const logs = await listLogs(pet.id);
  return NextResponse.json({ pet: toPetDTO(pet), logs: logs.map(toLogDTO) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const pet = await getPet(slug);
  if (!pet) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const updates = parsePetPatch(body);
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada a atualizar." }, { status: 400 });
  }

  const [updated] = await db
    .update(pets)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(pets.id, pet.id))
    .returning();

  return NextResponse.json({ pet: toPetDTO(updated) });
}
