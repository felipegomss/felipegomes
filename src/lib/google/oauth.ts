// OAuth do Google (fluxo de servidor web) para o Google Agenda.
// Precisa de GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET (projeto no Google Cloud,
// credencial "Aplicativo da Web", com a URI de redirecionamento
// https://<domínio>/api/google/callback).
import { eq } from "drizzle-orm";
import { db, googleAccounts, type GoogleAccount } from "@/lib/db/client";
import { open, seal } from "@/lib/secret-box";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

/** Endereços do Google. GOOGLE_ENDPOINTS_BASE troca todos (só para testes locais). */
const base = process.env.NODE_ENV !== "production" ? process.env.GOOGLE_ENDPOINTS_BASE : undefined;
export const GOOGLE = {
  auth: base ? `${base}/o/oauth2/v2/auth` : "https://accounts.google.com/o/oauth2/v2/auth",
  token: base ? `${base}/token` : "https://oauth2.googleapis.com/token",
  revoke: base ? `${base}/revoke` : "https://oauth2.googleapis.com/revoke",
  userinfo: base ? `${base}/v1/userinfo` : "https://openidconnect.googleapis.com/v1/userinfo",
  calendar: base ? `${base}/calendar/v3` : "https://www.googleapis.com/calendar/v3",
};

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const redirectUri = (origin: string) => `${origin}/api/google/callback`;

export function authUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    // Sempre pede consentimento: garante o refresh token mesmo reconectando.
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE.auth}?${params}`;
}

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string; scope?: string; error?: string; error_description?: string };

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(GOOGLE.token, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...body,
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || data.error) throw new GoogleAuthError(data.error_description ?? data.error ?? `HTTP ${res.status}`);
  return data;
}

export class GoogleAuthError extends Error {}

/** Troca o código do callback por tokens e salva a conexão. */
export async function connectWithCode(code: string, origin: string): Promise<GoogleAccount> {
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  if (!t.refresh_token) throw new GoogleAuthError("O Google não devolveu refresh token. Tente conectar de novo.");
  const email = await fetch(GOOGLE.userinfo, { headers: { authorization: `Bearer ${t.access_token}` }, cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((u: { email?: string } | null) => u?.email ?? null)
    .catch(() => null);
  const values = {
    email,
    refreshToken: seal(t.refresh_token),
    accessToken: seal(t.access_token),
    accessExpiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000),
    scope: t.scope ?? null,
    connectedAt: new Date(),
  };
  const [row] = await db
    .insert(googleAccounts)
    .values({ id: "me", ...values })
    .onConflictDoUpdate({ target: googleAccounts.id, set: values })
    .returning();
  return row;
}

export async function getGoogleAccount(): Promise<GoogleAccount | null> {
  const [row] = await db.select().from(googleAccounts).where(eq(googleAccounts.id, "me")).limit(1);
  return row ?? null;
}

/** Access token válido (renova com o refresh token quando expira). */
export async function accessToken(account?: GoogleAccount | null): Promise<string> {
  const acc = account ?? (await getGoogleAccount());
  if (!acc) throw new GoogleAuthError("Google Agenda não conectado.");
  const cached = open(acc.accessToken);
  if (cached && acc.accessExpiresAt && acc.accessExpiresAt.getTime() > Date.now()) return cached;
  const refresh = open(acc.refreshToken);
  if (!refresh) throw new GoogleAuthError("Conexão com o Google inválida. Conecte de novo.");
  const t = await tokenRequest({ refresh_token: refresh, grant_type: "refresh_token" });
  await db
    .update(googleAccounts)
    .set({ accessToken: seal(t.access_token), accessExpiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000) })
    .where(eq(googleAccounts.id, acc.id));
  return t.access_token;
}

/** Revoga no Google (melhor esforço) e apaga a conexão. */
export async function disconnectGoogle(): Promise<void> {
  const acc = await getGoogleAccount();
  if (!acc) return;
  const token = open(acc.refreshToken);
  if (token) {
    await fetch(`${GOOGLE.revoke}?token=${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" }).catch(() => null);
  }
  await db.delete(googleAccounts).where(eq(googleAccounts.id, acc.id));
}
