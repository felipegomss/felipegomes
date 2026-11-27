// Configurações editáveis pela tela (Conta › Integrações): provedor de IA,
// token do Instagram (Meta) e tokens de atalho. Segredos ficam criptografados
// e nunca voltam para o navegador — só um final ("…a1b2") para reconhecer.
import { createHash, randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { apiTokens, appSettings, db } from "@/lib/db/client";
import { open, seal } from "@/lib/secret-box";

async function readSetting<T>(key: string): Promise<T | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return (row?.value as T) ?? null;
}

async function writeSetting(key: string, value: unknown) {
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

const hint = (secret: string | null) => (secret ? `…${secret.slice(-4)}` : null);

// ── IA ──────────────────────────────────────────────────────────────────────

export const AI_PROVIDERS = {
  anthropic: { label: "Anthropic (Claude)", defaultModel: "claude-haiku-5-5", needsBaseUrl: false },
  openai: { label: "Compatível com OpenAI", defaultModel: "", needsBaseUrl: true },
} as const;
export type AiProvider = keyof typeof AI_PROVIDERS;

type StoredAi = { provider: AiProvider; model: string; baseUrl?: string | null; apiKey: string };
export type AiConfig = { provider: AiProvider; model: string; baseUrl: string | null; apiKey: string };
/** O que a tela vê: sem a chave. */
export type AiConfigPublic = { provider: AiProvider; model: string; baseUrl: string | null; keyHint: string | null; configured: boolean };

export async function getAiConfig(): Promise<AiConfig | null> {
  const s = await readSetting<StoredAi>("ai");
  const apiKey = open(s?.apiKey);
  if (!s || !apiKey) return null;
  return { provider: s.provider, model: s.model || AI_PROVIDERS[s.provider].defaultModel, baseUrl: s.baseUrl ?? null, apiKey };
}

export async function getAiConfigPublic(): Promise<AiConfigPublic> {
  const s = await readSetting<StoredAi>("ai");
  const key = open(s?.apiKey);
  return {
    provider: s?.provider ?? "anthropic",
    model: s?.model || AI_PROVIDERS[s?.provider ?? "anthropic"].defaultModel,
    baseUrl: s?.baseUrl ?? null,
    keyHint: hint(key),
    configured: !!key,
  };
}

/** `apiKey` vazio/ausente mantém a chave atual (a tela não reenvia a chave). */
export async function saveAiConfig(input: { provider?: unknown; model?: unknown; baseUrl?: unknown; apiKey?: unknown }): Promise<string | null> {
  const provider = typeof input.provider === "string" && input.provider in AI_PROVIDERS ? (input.provider as AiProvider) : null;
  if (!provider) return "Escolha o provedor.";
  const current = await readSetting<StoredAi>("ai");
  const newKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const apiKey = newKey ? seal(newKey) : current?.apiKey;
  if (!apiKey) return "Informe a chave da API.";
  const model = (typeof input.model === "string" ? input.model.trim() : "") || AI_PROVIDERS[provider].defaultModel;
  if (!model) return "Informe o modelo.";
  const baseUrl = typeof input.baseUrl === "string" && input.baseUrl.trim() ? input.baseUrl.trim().replace(/\/+$/, "") : null;
  if (AI_PROVIDERS[provider].needsBaseUrl) {
    const local = process.env.NODE_ENV !== "production" && /^http:\/\/localhost[:/]/.test(baseUrl ?? "");
    if (!baseUrl || (!/^https:\/\//.test(baseUrl) && !local)) return "Informe a URL base (https://…/v1).";
  }
  await writeSetting("ai", { provider, model, baseUrl, apiKey } satisfies StoredAi);
  return null;
}

export async function clearAiConfig() {
  await db.delete(appSettings).where(eq(appSettings.key, "ai"));
}

// ── Instagram (Meta oEmbed) ─────────────────────────────────────────────────

type StoredMeta = { accessToken: string };

export async function getMetaToken(): Promise<string | null> {
  return open((await readSetting<StoredMeta>("meta"))?.accessToken) ?? process.env.META_OEMBED_TOKEN ?? null;
}

export async function getMetaPublic() {
  const token = open((await readSetting<StoredMeta>("meta"))?.accessToken);
  return { configured: !!token, keyHint: hint(token), fromEnv: !token && !!process.env.META_OEMBED_TOKEN };
}

export async function saveMetaToken(token: unknown): Promise<string | null> {
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) {
    await db.delete(appSettings).where(eq(appSettings.key, "meta"));
    return null;
  }
  // Formato do token de app: "<app id>|<client token>".
  if (!/^\d+\|[A-Za-z0-9_-]+$/.test(t) && t.length < 40) return "Token inválido. Use “ID do app|token do cliente”.";
  await writeSetting("meta", { accessToken: seal(t) } satisfies StoredMeta);
  return null;
}

// ── Tokens de atalho ────────────────────────────────────────────────────────

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Cria um token e devolve o valor uma única vez. */
export async function createApiToken(name: string) {
  const token = `lfng_${randomBytes(24).toString("base64url")}`;
  const [row] = await db
    .insert(apiTokens)
    .values({ name: name.trim().slice(0, 60) || "Atalho", tokenHash: hash(token), prefix: token.slice(0, 9) })
    .returning();
  return { id: row.id, name: row.name, token };
}

export async function listApiTokens() {
  return db
    .select({ id: apiTokens.id, name: apiTokens.name, prefix: apiTokens.prefix, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt })
    .from(apiTokens)
    .where(isNull(apiTokens.revokedAt))
    .orderBy(desc(apiTokens.createdAt));
}

export async function revokeApiToken(id: string) {
  const res = await db.update(apiTokens).set({ revokedAt: new Date() }).where(and(eq(apiTokens.id, id), isNull(apiTokens.revokedAt))).returning();
  return res.length > 0;
}

/** Valida "Authorization: Bearer lfng_…" e registra o uso. */
export async function verifyApiToken(request: Request): Promise<boolean> {
  const m = request.headers.get("authorization")?.match(/^Bearer\s+(lfng_[A-Za-z0-9_-]+)$/);
  if (!m) return false;
  const [row] = await db
    .select()
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hash(m[1])), isNull(apiTokens.revokedAt)))
    .limit(1);
  if (!row) return false;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id));
  return true;
}
