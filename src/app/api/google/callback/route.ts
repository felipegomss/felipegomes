import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { connectWithCode } from "@/lib/google/oauth";
import { requestOrigin } from "@/lib/oauth";
import { safeEqual, unsign } from "@/lib/session";

const STATE_COOKIE = "google_oauth_state";

export async function GET(request: Request) {
  const origin = requestOrigin(request);
  const back = (q: string) => NextResponse.redirect(`${origin}/pt-BR/admin/agenda/agendas?${q}`);
  if (!(await isAdmin())) return NextResponse.redirect(`${origin}/pt-BR/admin/login`);

  const url = new URL(request.url);
  const store = await cookies();
  const raw = await unsign(store.get(STATE_COOKIE)?.value);
  store.delete({ name: STATE_COOKIE, path: "/api/google" });
  const [state, exp] = raw?.split(".") ?? [];
  const given = url.searchParams.get("state") ?? "";
  if (!state || Number(exp) < Date.now() || !safeEqual(state, given)) return back("erro=state");
  if (url.searchParams.get("error")) return back("erro=negado");

  const code = url.searchParams.get("code");
  if (!code) return back("erro=codigo");
  try {
    await connectWithCode(code, origin);
  } catch (e) {
    console.error("[google] callback falhou:", e);
    return back("erro=token");
  }
  return back("conectado=1");
}
