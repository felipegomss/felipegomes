"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/format-date";
import type { AiConfigPublic } from "@/lib/settings";

const SECTION_TITLE = "text-xs font-semibold uppercase tracking-[0.12em]";
const LABEL = "text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
const FIELD = "h-11 border-muted-foreground/70 dark:border-muted-foreground/70 max-sm:text-base";

type Provider = { id: string; label: string; defaultModel: string; needsBaseUrl: boolean };
type Token = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null };

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2", ok ? "bg-emerald-600 dark:bg-emerald-400" : "bg-muted-foreground/50")} aria-hidden="true" />
      {children}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="gap-1.5"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <CheckIcon aria-hidden="true" className="size-3.5" /> : <CopyIcon aria-hidden="true" className="size-3.5" />}
      {done ? "Copiado" : label}
    </Button>
  );
}

export function IntegrationsManager({
  ai,
  providers,
  meta,
  tokens,
  shortcutUrl,
}: {
  ai: AiConfigPublic;
  providers: Provider[];
  meta: { configured: boolean; keyHint: string | null; fromEnv: boolean };
  tokens: Token[];
  shortcutUrl: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Integrações</h1>
        <p className="leading-relaxed text-muted-foreground">Chaves e conexões usadas pelos Salvos. As chaves ficam criptografadas e não voltam para a tela.</p>
      </div>
      <AiSection initial={ai} providers={providers} />
      <MetaSection initial={meta} />
      <ShortcutSection initial={tokens} shortcutUrl={shortcutUrl} />
    </div>
  );
}

// ── IA ──────────────────────────────────────────────────────────────────────

function AiSection({ initial, providers }: { initial: AiConfigPublic; providers: Provider[] }) {
  const [cfg, setCfg] = useState(initial);
  const [provider, setProvider] = useState(initial.provider as string);
  const [model, setModel] = useState(initial.model);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState<null | "save" | "test" | "remove">(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const p = providers.find((x) => x.id === provider)!;
  const switching = provider !== cfg.provider;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setMsg(null);
    const res = await fetch("/api/settings/ai", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, model, baseUrl, apiKey }),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setMsg({ text: data?.error ?? "Não foi possível salvar.", ok: false });
    setCfg(data);
    setApiKey("");
    setMsg({ text: "Salvo. Testando…", ok: true });
    await test();
  }

  async function test() {
    setBusy("test");
    const res = await fetch("/api/settings/ai", { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    setMsg({ text: data?.message ?? "Falha no teste.", ok: res.ok });
  }

  async function remove() {
    setBusy("remove");
    const res = await fetch("/api/settings/ai", { method: "DELETE" });
    setBusy(null);
    if (res.ok) {
      setCfg(await res.json());
      setMsg({ text: "Chave removida. Os links passam a entrar sem categoria.", ok: true });
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-ai">
      <h2 id="sec-ai" className={SECTION_TITLE}>
        IA para categorizar
      </h2>
      <form onSubmit={save} className="flex flex-col gap-4 border p-4">
        <p className="text-muted-foreground">
          <Status ok={cfg.configured}>
            {cfg.configured ? (
              <>
                {providers.find((x) => x.id === cfg.provider)?.label} · {cfg.model} · chave {cfg.keyHint}
              </>
            ) : (
              "Nenhuma IA configurada: os links entram sem categoria (o Claude pode organizar depois)."
            )}
          </Status>
        </p>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={cn(LABEL, "mb-1.5")}>Provedor</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {providers.map((x) => (
              <label
                key={x.id}
                className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 border px-3", provider === x.id ? "border-foreground" : "hover:bg-muted")}
              >
                <input
                  type="radio"
                  name="provider"
                  value={x.id}
                  checked={provider === x.id}
                  onChange={() => {
                    setProvider(x.id);
                    setModel(x.id === cfg.provider ? cfg.model : x.defaultModel);
                  }}
                  className="accent-foreground"
                />
                {x.label}
              </label>
            ))}
          </div>
        </fieldset>

        {p.needsBaseUrl && (
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>URL base</span>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" className={FIELD} inputMode="url" />
            <span className="text-[11px] text-muted-foreground">Qualquer API compatível com OpenAI: OpenAI, OpenRouter, Groq, Gemini…</span>
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Modelo</span>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={p.defaultModel || "ex.: nome-do-modelo"} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Chave da API</span>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={cfg.configured && !switching ? `salva (${cfg.keyHint}) — deixe vazio para manter` : "cole a chave"}
              autoComplete="off"
              className={FIELD}
            />
          </label>
        </div>

        {msg && (
          <p role="status" className={msg.ok ? "text-muted-foreground" : "text-red-800 dark:text-red-400"}>
            {msg.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {cfg.configured && (
            <Button type="button" variant="ghost" size="lg" onClick={remove} disabled={!!busy} className="px-2 text-red-700 dark:text-red-400">
              Remover chave
            </Button>
          )}
          {cfg.configured && (
            <Button type="button" variant="outline" size="lg" onClick={test} disabled={!!busy} className="ml-auto gap-1.5">
              {busy === "test" && <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" />}
              Testar
            </Button>
          )}
          <Button type="submit" size="lg" disabled={!!busy} className={cn(!cfg.configured && "ml-auto")}>
            Salvar
          </Button>
        </div>
      </form>
    </section>
  );
}

// ── Instagram ───────────────────────────────────────────────────────────────

function MetaSection({ initial }: { initial: { configured: boolean; keyHint: string | null; fromEnv: boolean } }) {
  const [state, setState] = useState(initial);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function save(value: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/settings/meta", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: value }) });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setMsg({ text: data?.error ?? "Não foi possível salvar.", ok: false });
    setState(data);
    setToken("");
    setMsg({ text: value ? "Token salvo." : "Token removido.", ok: true });
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-meta">
      <h2 id="sec-meta" className={SECTION_TITLE}>
        Instagram (Meta)
      </h2>
      <div className="flex flex-col gap-4 border p-4">
        <p className="text-muted-foreground">
          <Status ok={state.configured || state.fromEnv}>
            {state.configured ? `Token salvo (${state.keyHint}). Legendas de Reels e posts são lidas.` : state.fromEnv ? "Usando o token da variável de ambiente." : "Sem token: posts do Instagram entram só com o link."}
          </Status>
        </p>
        <details className="border">
          <summary className="flex min-h-11 cursor-pointer items-center px-3">Como gerar o token (uns 5 minutos)</summary>
          <ol className="flex list-decimal flex-col gap-1.5 px-3 pb-3 pl-7 leading-relaxed text-muted-foreground">
            <li>
              Em <span className="text-foreground">developers.facebook.com</span>, entre com sua conta e clique em <span className="text-foreground">Meus apps › Criar app</span> (tipo “Outro” › “Empresa”).
            </li>
            <li>
              No app, adicione o produto <span className="text-foreground">oEmbed</span> (ou “Instagram oEmbed”).
            </li>
            <li>
              Em <span className="text-foreground">Configurações do app › Básico</span>, copie o <span className="text-foreground">ID do app</span>. Em <span className="text-foreground">Avançado</span>, copie o{" "}
              <span className="text-foreground">Token do cliente</span>.
            </li>
            <li>
              Cole abaixo no formato <code className="text-foreground">ID_DO_APP|TOKEN_DO_CLIENTE</code> e publique o app (modo “Ativo”).
            </li>
          </ol>
        </details>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim()) save(token);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="sr-only">Token da Meta</span>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ID_DO_APP|TOKEN_DO_CLIENTE" autoComplete="off" className={FIELD} />
          </label>
          <div className="flex gap-2">
            {state.configured && (
              <Button type="button" variant="ghost" size="lg" onClick={() => save("")} disabled={busy} className="h-11 text-red-700 dark:text-red-400">
                Remover
              </Button>
            )}
            <Button type="submit" size="lg" disabled={busy || !token.trim()} className="h-11">
              Salvar
            </Button>
          </div>
        </form>
        {msg && (
          <p role="status" className={msg.ok ? "text-muted-foreground" : "text-red-800 dark:text-red-400"}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Atalho do iPhone ────────────────────────────────────────────────────────

function ShortcutSection({ initial, shortcutUrl }: { initial: Token[]; shortcutUrl: string }) {
  const router = useRouter();
  const [tokens, setTokens] = useState(initial);
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/settings/tokens", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Atalho do iPhone" }) });
    const data = await res.json();
    setBusy(false);
    setCreated({ token: data.token, name: data.name });
    setTokens([{ id: data.id, name: data.name, prefix: data.token.slice(0, 9), createdAt: new Date().toISOString(), lastUsedAt: null }, ...tokens]);
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/settings/tokens/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTokens(tokens.filter((t) => t.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-shortcut">
      <h2 id="sec-shortcut" className={SECTION_TITLE}>
        Atalho do iPhone
      </h2>
      <div className="flex flex-col gap-4 border p-4">
        <p className="leading-relaxed text-muted-foreground">
          Salva direto do menu Compartilhar do TikTok, Instagram, X, YouTube ou Safari, sem abrir o app. O atalho manda o link com um token; dá para revogar aqui.
        </p>

        {tokens.length > 0 && (
          <ul className="border">
            {tokens.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.prefix}… · criado {formatDay(t.createdAt)} · {t.lastUsedAt ? `usado ${formatDay(t.lastUsedAt)}` : "nunca usado"}
                  </span>
                </span>
                <Button type="button" variant="outline" size="lg" onClick={() => revoke(t.id)}>
                  Revogar
                </Button>
              </li>
            ))}
          </ul>
        )}

        {created ? (
          <div className="flex flex-col gap-3 border border-foreground/40 p-3">
            <p className="font-semibold">Token criado. Copie agora: ele não aparece de novo.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 truncate border bg-muted px-2.5 py-2">{created.token}</code>
              <CopyButton value={created.token} label="Copiar token" />
            </div>
            <ol className="flex list-decimal flex-col gap-1.5 pl-4 leading-relaxed text-muted-foreground">
              <li>
                No app <span className="text-foreground">Atalhos</span>, toque em <span className="text-foreground">+</span> e dê o nome <span className="text-foreground">Salvar no LFNG</span>.
              </li>
              <li>
                Toque no <span className="text-foreground">ⓘ</span> e ligue <span className="text-foreground">Mostrar na Planilha de Compartilhamento</span> (tipos: URLs e Texto).
              </li>
              <li>
                Adicione a ação <span className="text-foreground">Obter Conteúdo do URL</span> com a URL <code className="break-all text-foreground">{shortcutUrl}</code>
                <CopyButton value={shortcutUrl} label="Copiar URL" />
              </li>
              <li>
                Nela: Método <span className="text-foreground">POST</span>; Cabeçalho <code className="text-foreground">Authorization</code> = <code className="text-foreground">Bearer </code>+ o token; Corpo{" "}
                <span className="text-foreground">JSON</span> com o campo <code className="text-foreground">url</code> = <span className="text-foreground">Entrada do Atalho</span>.
              </li>
              <li>
                Adicione <span className="text-foreground">Obter Valor do Dicionário</span> (chave <code className="text-foreground">message</code>) e <span className="text-foreground">Mostrar Notificação</span> com o resultado.
              </li>
            </ol>
            <Button type="button" variant="ghost" size="lg" className="self-start" onClick={() => setCreated(null)}>
              Pronto
            </Button>
          </div>
        ) : (
          <Button type="button" size="lg" onClick={create} disabled={busy} className="self-start">
            {tokens.length ? "Criar outro token" : "Criar token para o atalho"}
          </Button>
        )}
      </div>
    </section>
  );
}
