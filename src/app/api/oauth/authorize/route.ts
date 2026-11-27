import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createCode, getClient } from "@/lib/oauth";

/** Valida o pedido e devolve um erro OAuth ou os parâmetros normalizados. */
async function validate(p: URLSearchParams) {
  const client = await getClient(p.get("client_id"));
  const redirectUri = p.get("redirect_uri") ?? client?.redirectUris[0] ?? "";
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return { fatal: "Cliente ou redirect_uri inválido." as const };
  }
  if (p.get("response_type") !== "code") return { client, redirectUri, error: "unsupported_response_type" };
  const challenge = p.get("code_challenge");
  if (!challenge || (p.get("code_challenge_method") ?? "S256") !== "S256") {
    return { client, redirectUri, error: "invalid_request" };
  }
  return { client, redirectUri, challenge, state: p.get("state") ?? undefined };
}

function back(redirectUri: string, params: Record<string, string | undefined>) {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
}

/** GET: o agente abre esta URL; mandamos para a tela de aprovação do app. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const v = await validate(p);
  if ("fatal" in v) return new Response(v.fatal, { status: 400 });
  if ("error" in v && v.error) return back(v.redirectUri, { error: v.error, state: p.get("state") ?? undefined });
  const url = new URL("/pt-BR/admin/autorizar", request.url);
  url.search = p.toString();
  return NextResponse.redirect(url, 303);
}

/** POST: decisão da tela de aprovação (exige sessão do admin). */
export async function POST(request: Request) {
  const form = new URLSearchParams(await request.text());
  const v = await validate(form);
  if ("fatal" in v) return new Response(v.fatal, { status: 400 });
  if ("error" in v && v.error) return back(v.redirectUri, { error: v.error, state: form.get("state") ?? undefined });
  if (!(await isAdmin())) return new Response("Sessão expirada. Entre de novo e tente conectar outra vez.", { status: 401 });

  if (form.get("decision") !== "approve") return back(v.redirectUri, { error: "access_denied", state: v.state });
  const code = await createCode({ clientId: v.client.id, redirectUri: v.redirectUri, codeChallenge: v.challenge! });
  return back(v.redirectUri, { code, state: v.state });
}
