import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveLink, searchLinks } from "@/lib/salvos/service";

export const maxDuration = 60;

/** `?q=…&categoria=…` (categoria vazia = sem categoria). */
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(request.url).searchParams;
  return NextResponse.json(await searchLinks({ q: sp.get("q") ?? "", category: sp.has("categoria") ? sp.get("categoria") : null }));
}

/** `{ url, note?, category?, tags? }` — lê o link e categoriza antes de responder. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  const result = await saveLink({ url: body.url, note: body.note, category: body.category, tags: body.tags });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
}
