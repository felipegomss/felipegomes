import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = /^\/(pt-BR|en)\/admin(\/|$)/.test(pathname);
  const isLoginPage = /^\/(pt-BR|en)\/admin\/login(\/|$)/.test(pathname);
  // Ferramentas pessoais fora de /admin que também exigem login.
  const isPrivateRoute = /^\/(pt-BR|en)\/pets(\/|$)/.test(pathname);

  if ((isAdminRoute && !isLoginPage) || isPrivateRoute) {
    if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))) {
      const locale = pathname.split("/")[1] ?? "pt-BR";
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      if (isPrivateRoute) loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|u/|_next|.*\\..*).*)"],
};
