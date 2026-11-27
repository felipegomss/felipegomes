import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { revokeApiToken } from "@/lib/settings";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await revokeApiToken(id))) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
