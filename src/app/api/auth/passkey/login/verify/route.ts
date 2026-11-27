import { NextResponse } from "next/server";
import { verifyAuthentication } from "@/lib/passkeys";
import { SESSION_COOKIE, SESSION_COOKIE_OPTS, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.response) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  try {
    const result = await verifyAuthentication(request, body.response);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }

  const token = await createSessionToken();
  if (!token) return NextResponse.json({ error: "Sessão indisponível." }, { status: 500 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTS);
  return response;
}
