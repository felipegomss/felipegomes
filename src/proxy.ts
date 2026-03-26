import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export const proxy = intlMiddleware;

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
