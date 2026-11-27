import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { adminPasskeys, db } from "@/lib/db/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim().slice(0, 60);
  if (!name) return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  const updated = await db.update(adminPasskeys).set({ name }).where(eq(adminPasskeys.id, id)).returning();
  if (!updated.length) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const deleted = await db.delete(adminPasskeys).where(eq(adminPasskeys.id, id)).returning();
  if (!deleted.length) return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
