import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getMetaPublic, saveMetaToken } from "@/lib/settings";

/** `{ token }` — vazio remove. */
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const error = await saveMetaToken(body?.token);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(await getMetaPublic());
}
