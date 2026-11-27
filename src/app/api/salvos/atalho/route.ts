import { NextResponse } from "next/server";
import { saveLink } from "@/lib/salvos/service";
import { PLATFORM_LABELS } from "@/lib/salvos/platforms";
import { verifyApiToken } from "@/lib/settings";

export const maxDuration = 60;

const INVALID = "Token inválido. Gere outro em Conta › Integrações.";

async function save(url: unknown) {
  const result = await saveLink({ url }, "shortcut");
  if ("error" in result) return { status: 400, message: result.error, item: null };
  const { item, duplicate } = result;
  const where = item.category ? ` em ${item.category}` : "";
  return {
    status: duplicate ? 200 : 201,
    message: duplicate ? `Já estava salvo${where}.` : `Salvo${where}: ${item.title ?? PLATFORM_LABELS[item.platform]}`,
    item: { id: item.id, title: item.title, category: item.category, tags: item.tags },
  };
}

/**
 * Jeito simples (app Atalhos, só "Obter Conteúdo do URL"):
 *   GET /api/salvos/atalho?t=lfng_…&url=<link>
 * `url` vai por último: tudo depois de "url=" é o link, mesmo com ? e & do
 * próprio link, então o atalho não precisa codificar nada. Responde texto
 * puro, pronto para "Mostrar Notificação".
 */
export async function GET(request: Request) {
  const text = (body: string, status: number) => new NextResponse(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
  if (!(await verifyApiToken(request))) return text(INVALID, 401);
  const raw = request.url;
  const i = raw.search(/[?&]url=/);
  let url = i >= 0 ? raw.slice(raw.indexOf("=", i) + 1) : "";
  try {
    if (/^https?%3A/i.test(url)) url = decodeURIComponent(url);
  } catch {
    // fica como veio
  }
  const r = await save(url);
  return text(r.message, r.status);
}

/** Jeito completo: `Authorization: Bearer lfng_…` e `{ "url": "…" }` (ou texto puro) no corpo. */
export async function POST(request: Request) {
  if (!(await verifyApiToken(request))) return NextResponse.json({ error: "Token inválido.", message: INVALID }, { status: 401 });
  const raw = await request.text();
  let url: unknown = raw;
  try {
    const body = JSON.parse(raw) as { url?: unknown };
    url = body.url ?? raw;
  } catch {
    // texto puro
  }
  const r = await save(url);
  if (!r.item) return NextResponse.json({ error: r.message, message: r.message }, { status: r.status });
  return NextResponse.json({ message: r.message, item: r.item }, { status: r.status });
}
