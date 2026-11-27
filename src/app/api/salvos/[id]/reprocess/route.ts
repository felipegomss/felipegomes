import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { reprocessLink } from "@/lib/salvos/service";

export const maxDuration = 60;

/** Lê o link de novo e recategoriza. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await reprocessLink(id);
  if (!result) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  return NextResponse.json(result);
}
