// Sessão do admin: token assinado com HMAC-SHA256, no lugar da senha em texto
// puro no cookie. Só usa Web Crypto, então roda no proxy e nas rotas.
//
// Formato: v1.<expiraEm (ms)>.<assinatura base64url>
// Chave: SESSION_SECRET, ou derivada de ADMIN_PASSWORD (trocar a senha derruba
// todas as sessões, que é o comportamento esperado).

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

const enc = new TextEncoder();

function secret(): string | null {
  const s = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD;
  return s ? `lfng-session:${s}` : null;
}

function b64url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const key = await crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

/** Comparação em tempo constante. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Assina um valor qualquer (usado também para o desafio do WebAuthn). */
export async function sign(value: string): Promise<string | null> {
  const sig = await hmac(value);
  return sig ? `${value}.${sig}` : null;
}

/** Devolve o valor original se a assinatura bater; senão null. */
export async function unsign(signed: string | undefined): Promise<string | null> {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const expected = await hmac(value);
  return expected && safeEqual(signed.slice(i + 1), expected) ? value : null;
}

export async function createSessionToken(now = Date.now()): Promise<string | null> {
  return sign(`v1.${now + SESSION_MAX_AGE * 1000}`);
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const value = await unsign(token);
  if (!value) return false;
  const [version, exp] = value.split(".");
  return version === "v1" && Number(exp) > now;
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
