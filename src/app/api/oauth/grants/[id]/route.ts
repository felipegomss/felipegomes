import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { revokeGrant } from "@/lib/oauth";

/** Revoga a autorização de um agente (os tokens param de valer na hora). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await revokeGrant(id))) {
    return NextResponse.json({ error: "Não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
