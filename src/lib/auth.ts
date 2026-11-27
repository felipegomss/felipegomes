import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** True quando há uma sessão de admin válida (token assinado e não expirado). */
export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
