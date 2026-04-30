import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isEmailRoute = /^\/(pt-BR|en)\/email(\/|$)/.test(pathname);
  const isLoginPage = /^\/(pt-BR|en)\/email\/login(\/|$)/.test(pathname);

  if (isEmailRoute && !isLoginPage) {
    const session = request.cookies.get("email_session");
    if (!session || session.value !== process.env.EMAIL_PASSWORD) {
      const locale = pathname.split("/")[1] ?? "pt-BR";
      return NextResponse.redirect(new URL(`/${locale}/email/login`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
