import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { AiError, testAi } from "@/lib/ai/client";
import { clearAiConfig, getAiConfigPublic, saveAiConfig } from "@/lib/settings";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAiConfigPublic());
}

/** `{ provider, model?, baseUrl?, apiKey? }` — sem apiKey mantém a atual. */
export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  const error = await saveAiConfig(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json(await getAiConfigPublic());
}

/** Testa a configuração salva. */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, message: await testAi() });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof AiError ? e.message : "Falha no teste." }, { status: 400 });
  }
}

export async function DELETE() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearAiConfig();
  return NextResponse.json(await getAiConfigPublic());
}
