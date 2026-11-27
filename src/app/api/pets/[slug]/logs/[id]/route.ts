import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deletePetLog, updatePetLog } from "@/lib/pets/actions";

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const result = await updatePetLog({ slug, id, occurredAt: body.occurredAt, data: body.data, notes: body.notes });
  if (!result.ok) return NextResponse.json({ error: result.error, fields: result.fields }, { status: result.status });
  return NextResponse.json({ log: result.value });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug, id } = await params;
  const result = await deletePetLog(slug, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
