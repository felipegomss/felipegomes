import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = /^\/(pt-BR|en)\/admin(\/|$)/.test(pathname);
  const isLoginPage = /^\/(pt-BR|en)\/admin\/login(\/|$)/.test(pathname);
  // Ferramentas pessoais fora de /admin que também exigem login.
  const isPrivateRoute = /^\/(pt-BR|en)\/pets(\/|$)/.test(pathname);

  if ((isAdminRoute && !isLoginPage) || isPrivateRoute) {
    const session = request.cookies.get("admin_session");
    if (!session || session.value !== process.env.ADMIN_PASSWORD) {
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
