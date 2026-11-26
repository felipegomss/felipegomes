import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

/** True quando o cookie de sessão do admin bate com `ADMIN_PASSWORD`. */
export async function isAdmin(): Promise<boolean> {
  const session = (await cookies()).get(ADMIN_COOKIE);
  return !!session && !!process.env.ADMIN_PASSWORD && session.value === process.env.ADMIN_PASSWORD;
}
