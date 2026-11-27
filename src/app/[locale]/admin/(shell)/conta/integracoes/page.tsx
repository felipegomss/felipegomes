import type { Metadata } from "next";
import { headers } from "next/headers";
import { AI_PROVIDERS, getAiConfigPublic, listApiTokens } from "@/lib/settings";
import { IntegrationsManager } from "./integrations-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Integrações" };

export default async function IntegrationsPage() {
  const [ai, tokens, h] = await Promise.all([getAiConfigPublic(), listApiTokens(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.lfng.dev";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return (
    <IntegrationsManager
      ai={ai}
      providers={Object.entries(AI_PROVIDERS).map(([id, p]) => ({ id, label: p.label, defaultModel: p.defaultModel, needsBaseUrl: p.needsBaseUrl }))}
      tokens={tokens.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), lastUsedAt: t.lastUsedAt?.toISOString() ?? null }))}
      shortcutUrl={`${proto}://${host}/api/salvos/atalho`}
    />
  );
}
