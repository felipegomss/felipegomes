import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteLink, updateLink } from "@/lib/salvos/service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  const result = await updateLink(id, body);
  if (result === null) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  if (typeof result === "string") return NextResponse.json({ error: result }, { status: 400 });
  return NextResponse.json({ item: result });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await deleteLink(id))) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
