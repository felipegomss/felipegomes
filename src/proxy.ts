import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = /^\/(pt-BR|en)\/admin(\/|$)/.test(pathname);
  const isLoginPage = /^\/(pt-BR|en)\/admin\/login(\/|$)/.test(pathname);

  if (isAdminRoute && !isLoginPage) {
    const session = request.cookies.get("admin_session");
    if (!session || session.value !== process.env.ADMIN_PASSWORD) {
      const locale = pathname.split("/")[1] ?? "pt-BR";
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
