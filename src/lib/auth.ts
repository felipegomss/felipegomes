import { cookies } from "next/headers";
import { SESSION_COOKIE, unsign, verifySessionToken } from "./session";

/** True quando há uma sessão de admin válida (token assinado e não expirado). */
export async function isAdmin(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Quando a sessão atual expira (null se não houver sessão válida). */
export async function sessionExpiry(): Promise<Date | null> {
  const value = await unsign((await cookies()).get(SESSION_COOKIE)?.value);
  const exp = Number(value?.split(".")[1]);
  return Number.isFinite(exp) && exp > Date.now() ? new Date(exp) : null;
}
