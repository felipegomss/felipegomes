import { NextResponse } from "next/server";
import { saveLink } from "@/lib/salvos/service";
import { PLATFORM_LABELS } from "@/lib/salvos/extract";
import { verifyApiToken } from "@/lib/settings";

export const maxDuration = 60;

/**
 * Atalho do iPhone ("Salvar no LFNG"): `Authorization: Bearer lfng_…` e o
 * link no corpo (`{ "url": "…" }` ou texto puro). Responde uma frase curta
 * para o atalho mostrar na notificação.
 */
export async function POST(request: Request) {
  if (!(await verifyApiToken(request))) return NextResponse.json({ error: "Token inválido.", message: "Token inválido. Gere outro em Conta › Integrações." }, { status: 401 });
  const raw = await request.text();
  let url: unknown = raw;
  try {
    const body = JSON.parse(raw) as { url?: unknown };
    url = body.url ?? raw;
  } catch {
    // texto puro
  }
  const result = await saveLink({ url }, "shortcut");
  if ("error" in result) return NextResponse.json({ error: result.error, message: result.error }, { status: 400 });
  const { item, duplicate } = result;
  const where = item.category ? ` em ${item.category}` : "";
  const message = duplicate ? `Já estava salvo${where}.` : `Salvo${where}: ${item.title ?? PLATFORM_LABELS[item.platform]}`;
  return NextResponse.json({ message, item: { id: item.id, title: item.title, category: item.category, tags: item.tags } }, { status: duplicate ? 200 : 201 });
}
