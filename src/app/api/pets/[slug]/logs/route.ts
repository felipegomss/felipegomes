import { NextResponse } from "next/server";
import { db, petLogs } from "@/lib/db/client";
import { isAdmin } from "@/lib/auth";
import { getPet, toLogDTO } from "@/lib/pets/repo";
import { PET_LOG_TYPES, parseLogData, type PetLogType } from "@/lib/pets/types";

type Ctx = { params: Promise<{ slug: string }> };

type PostBody = {
  type?: string;
  occurredAt?: string;
  data?: unknown;
  notes?: string;
};

export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const pet = await getPet(slug);
  if (!pet) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as PostBody | null;
  if (!body || !(PET_LOG_TYPES as readonly string[]).includes(body.type ?? "")) {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  const type = body.type as PetLogType;

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }

  const parsed = parseLogData(type, body.data);
  if ("errors" in parsed) {
    return NextResponse.json({ error: "Campos inválidos.", fields: parsed.errors }, { status: 400 });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) || null : null;

  const [created] = await db
    .insert(petLogs)
    .values({ petId: pet.id, type, occurredAt, data: parsed.data, notes })
    .returning();

  return NextResponse.json({ log: toLogDTO(created) }, { status: 201 });
}
