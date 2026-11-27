import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createApiToken } from "@/lib/settings";

/** Cria um token de atalho; o valor só aparece nesta resposta. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: unknown };
  return NextResponse.json(await createApiToken(typeof body.name === "string" ? body.name : "Atalho"), { status: 201 });
}
