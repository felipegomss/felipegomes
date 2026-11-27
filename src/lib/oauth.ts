// Servidor OAuth 2.1 mínimo para conectar agentes (MCP) ao app.
// - Registro dinâmico de clientes (o Claude se registra sozinho).
// - Authorization code + PKCE (S256); a aprovação acontece na tela do app,
//   depois do login com passkey.
// - Tokens assinados (HMAC, mesma chave da sessão) que só valem enquanto a
//   autorização (grant) não for revogada.
import { createHash, randomUUID } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, oauthClients, oauthGrants } from "@/lib/db/client";
import { safeEqual, sign, unsign } from "@/lib/session";

export const ACCESS_TTL = 60 * 60; // 1 h
const REFRESH_TTL = 60 * 60 * 24 * 90; // 90 dias
const CODE_TTL = 5 * 60;
export const MCP_SCOPE = "app";

/** Origem pública da requisição (respeita o proxy da Vercel). */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function signPayload(kind: string, payload: Record<string, unknown>): Promise<string> {
  const value = await sign(`${kind}.${b64url(JSON.stringify(payload))}`);
  if (!value) throw new Error("Chave de assinatura ausente (ADMIN_PASSWORD/SESSION_SECRET).");
  return value;
}

async function readPayload<T>(kind: string, token: string | undefined | null): Promise<T | null> {
  const value = await unsign(token ?? undefined);
  if (!value) return null;
  const [k, body] = value.split(".");
  if (k !== kind || !body) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    return data.exp * 1000 > Date.now() ? data : null;
  } catch {
    return null;
  }
}

const now = () => Math.floor(Date.now() / 1000);

// ── Clientes ────────────────────────────────────────────────────────────────

function validRedirect(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.hash) return false;
    if (u.protocol === "https:") return true;
    return u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export async function registerClient(body: unknown) {
  const b = (body ?? {}) as { client_name?: unknown; redirect_uris?: unknown };
  const redirectUris = Array.isArray(b.redirect_uris) ? b.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!redirectUris.length || !redirectUris.every(validRedirect)) {
    return { ok: false as const, error: "invalid_redirect_uri" };
  }
  const name = typeof b.client_name === "string" && b.client_name.trim() ? b.client_name.trim().slice(0, 80) : "Agente";
  const id = randomUUID();
  await db.insert(oauthClients).values({ id, name, redirectUris });
  return { ok: true as const, client: { id, name, redirectUris } };
}

export async function getClient(id: string | null | undefined) {
  if (!id) return null;
  const [c] = await db.select().from(oauthClients).where(eq(oauthClients.id, id)).limit(1);
  return c ?? null;
}

// ── Código de autorização ───────────────────────────────────────────────────

export type AuthorizeParams = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
};

export async function createCode(p: AuthorizeParams): Promise<string> {
  return signPayload("code", { c: p.clientId, r: p.redirectUri, ch: p.codeChallenge, exp: now() + CODE_TTL });
}

function s256(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

// ── Tokens ──────────────────────────────────────────────────────────────────

async function issueTokens(grantId: string, clientId: string) {
  const exp = now() + ACCESS_TTL;
  return {
    access_token: await signPayload("at", { g: grantId, c: clientId, exp }),
    refresh_token: await signPayload("rt", { g: grantId, c: clientId, exp: now() + REFRESH_TTL }),
    token_type: "Bearer",
    expires_in: ACCESS_TTL,
    scope: MCP_SCOPE,
  };
}

async function activeGrant(id: string) {
  const [g] = await db
    .select()
    .from(oauthGrants)
    .where(and(eq(oauthGrants.id, id), isNull(oauthGrants.revokedAt)))
    .limit(1);
  return g ?? null;
}

type TokenError = { error: string; error_description?: string };

export async function exchangeCode(params: URLSearchParams): Promise<ReturnType<typeof issueTokens> | TokenError> {
  const code = await readPayload<{ c: string; r: string; ch: string }>("code", params.get("code"));
  if (!code) return { error: "invalid_grant", error_description: "Código inválido ou expirado." };
  const clientId = params.get("client_id") ?? code.c;
  if (clientId !== code.c) return { error: "invalid_grant", error_description: "client_id não confere." };
  if (params.get("redirect_uri") && params.get("redirect_uri") !== code.r) {
    return { error: "invalid_grant", error_description: "redirect_uri não confere." };
  }
  const verifier = params.get("code_verifier");
  if (!verifier || !safeEqual(s256(verifier), code.ch)) {
    return { error: "invalid_grant", error_description: "PKCE inválido." };
  }
  if (!(await getClient(code.c))) return { error: "invalid_client" };
  const [grant] = await db.insert(oauthGrants).values({ clientId: code.c }).returning();
  return issueTokens(grant.id, code.c);
}

export async function refreshTokens(params: URLSearchParams): Promise<ReturnType<typeof issueTokens> | TokenError> {
  const rt = await readPayload<{ g: string; c: string }>("rt", params.get("refresh_token"));
  if (!rt || !(await activeGrant(rt.g))) return { error: "invalid_grant", error_description: "Refresh token inválido ou revogado." };
  return issueTokens(rt.g, rt.c);
}

/** Valida o Bearer do MCP. Devolve o grant ativo ou null. */
export async function verifyAccessToken(token: string | null | undefined) {
  const at = await readPayload<{ g: string; c: string; exp: number }>("at", token);
  if (!at) return null;
  const grant = await activeGrant(at.g);
  if (!grant) return null;
  await db.update(oauthGrants).set({ lastUsedAt: new Date() }).where(eq(oauthGrants.id, grant.id));
  return { grantId: grant.id, clientId: at.c, expiresAt: at.exp };
}

// ── Gerenciamento (tela de Conta) ───────────────────────────────────────────

export async function listGrants() {
  return db
    .select({
      id: oauthGrants.id,
      clientName: oauthClients.name,
      createdAt: oauthGrants.createdAt,
      lastUsedAt: oauthGrants.lastUsedAt,
    })
    .from(oauthGrants)
    .innerJoin(oauthClients, eq(oauthClients.id, oauthGrants.clientId))
    .where(isNull(oauthGrants.revokedAt))
    .orderBy(desc(oauthGrants.createdAt));
}

export async function revokeGrant(id: string) {
  const updated = await db
    .update(oauthGrants)
    .set({ revokedAt: new Date() })
    .where(and(eq(oauthGrants.id, id), isNull(oauthGrants.revokedAt)))
    .returning();
  return updated.length > 0;
}
