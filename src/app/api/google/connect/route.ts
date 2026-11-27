import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { authUrl, googleConfigured } from "@/lib/google/oauth";
import { requestOrigin } from "@/lib/oauth";
import { sign } from "@/lib/session";

const STATE_COOKIE = "google_oauth_state";

/** Começa a conexão com o Google: guarda um `state` assinado e redireciona. */
export async function GET(request: Request) {
  const origin = requestOrigin(request);
  if (!(await isAdmin())) return NextResponse.redirect(`${origin}/pt-BR/admin/login?next=/pt-BR/admin/agenda/agendas`);
  if (!googleConfigured()) return NextResponse.redirect(`${origin}/pt-BR/admin/agenda/agendas?erro=config`);
  const state = randomBytes(16).toString("base64url");
  (await cookies()).set(STATE_COOKIE, (await sign(`${state}.${Date.now() + 10 * 60_000}`))!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/google",
    maxAge: 600,
  });
  return NextResponse.redirect(authUrl(origin, state));
}
