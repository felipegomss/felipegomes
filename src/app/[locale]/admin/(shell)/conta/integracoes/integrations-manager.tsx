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
  tokens,
  shortcutUrl,
}: {
  ai: AiConfigPublic;
  providers: Provider[];
  tokens: Token[];
  shortcutUrl: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 text-xs">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">O que os Salvos usam para categorizar e receber links.</p>
      </div>
      <AiSection initial={ai} providers={providers} />
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
  // Com chave salva, o campo mostra um valor mascarado até a pessoa focar nele.
  const [editingKey, setEditingKey] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "test" | "remove">(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const p = providers.find((x) => x.id === provider)!;
  const masked = cfg.configured && provider === cfg.provider && !editingKey && !apiKey;

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
    setEditingKey(false);
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
      setMsg({ text: "Chave removida.", ok: true });
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="sec-ai">
      <h2 id="sec-ai" className={SECTION_TITLE}>
        IA
      </h2>
      <form onSubmit={save} className="flex flex-col gap-4 border p-4">
        <p className="text-muted-foreground">Dá título, resumo, categoria e tags a cada link salvo.</p>
        <p className="text-muted-foreground">
          <Status ok={cfg.configured}>
            {cfg.configured ? (
              <>
                {providers.find((x) => x.id === cfg.provider)?.label} · {cfg.model}
              </>
            ) : (
              "Sem chave. Os links entram sem categoria."
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
            <span className="text-[11px] text-muted-foreground">Serve para OpenAI, OpenRouter, Groq, Gemini e outros no mesmo formato.</span>
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
              value={masked ? `${"•".repeat(20)}${cfg.keyHint?.slice(1) ?? ""}` : apiKey}
              onFocus={() => setEditingKey(true)}
              onBlur={() => !apiKey && setEditingKey(false)}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole a chave"
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

// ── Atalho do iPhone ────────────────────────────────────────────────────────

/**
 * Passo a passo do atalho (iOS 27). A URL já leva o token; o link compartilhado
 * entra no fim, depois de "url=", então o atalho é só: receber › obter › notificar.
 */
function ShortcutGuide({ url, onDone }: { url: string; onDone: () => void }) {
  const describe = `Quando eu compartilhar um link, use Obter Conteúdo do URL com o endereço ${url} seguido do link compartilhado, e mostre o resultado em uma notificação.`;
  const strong = "text-foreground";
  return (
    <div className="flex flex-col gap-4 border border-foreground/40 p-3">
      <div className="flex flex-col gap-2">
        <p className="font-semibold">URL do atalho. Copie agora, ela não aparece de novo.</p>
        <code className="block border bg-muted px-2.5 py-2 break-all">{url}</code>
        <CopyButton value={url} label="Copiar URL" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-semibold">No app Atalhos</p>
        <ol className="flex list-decimal flex-col gap-2 pl-4 leading-relaxed text-muted-foreground">
          <li>
            Abra <span className={strong}>Atalhos</span>, toque em <span className={strong}>+</span> e renomeie para <span className={strong}>Salvar no LFNG</span> (toque no nome, no topo).
          </li>
          <li>
            Toque no nome › <span className={strong}>Detalhes</span> (ou no ⓘ) e ative <span className={strong}>Mostrar na Planilha de Compartilhamento</span>. Nos tipos aceitos, deixe só <span className={strong}>URLs</span>. Aparece no topo
            “Receber <span className={strong}>URLs</span> de Planilha de Compartilhamento”.
          </li>
          <li>
            Adicione a ação <span className={strong}>Obter Conteúdo do URL</span>. No campo do endereço, cole a URL copiada e, logo depois do <code className={strong}>url=</code>, toque em{" "}
            <span className={strong}>Entrada do Atalho</span> na barra de variáveis. Não precisa mexer em método, cabeçalho nem corpo.
          </li>
          <li>
            Adicione <span className={strong}>Mostrar Notificação</span> e escolha <span className={strong}>Conteúdo do URL</span>.
          </li>
          <li>
            Teste: no TikTok, Instagram, X ou Safari, toque em <span className={strong}>Compartilhar</span> › <span className={strong}>Salvar no LFNG</span> (talvez em “Mais” / “Editar ações” na primeira vez). Deve aparecer
            “Salvo em …”.
          </li>
        </ol>
      </div>

      <details className="border">
        <summary className="flex min-h-11 cursor-pointer items-center px-3">Ou peça para o iOS montar</summary>
        <div className="flex flex-col gap-2 px-3 pb-3 leading-relaxed text-muted-foreground">
          <p>
            Em <span className={strong}>+</span> › <span className={strong}>Descrever um Atalho</span>, cole o texto abaixo. Depois confira se “Mostrar na Planilha de Compartilhamento” ficou ligado.
          </p>
          <code className="block border bg-muted px-2.5 py-2 break-all text-foreground">{describe}</code>
          <CopyButton value={describe} label="Copiar descrição" />
        </div>
      </details>

      <Button type="button" variant="ghost" size="lg" className="self-start" onClick={onDone}>
        Pronto
      </Button>
    </div>
  );
}

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
          Salva um link pelo menu Compartilhar, sem abrir o app.
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
          <ShortcutGuide url={`${shortcutUrl}?t=${created.token}&url=`} onDone={() => setCreated(null)} />        ) : (
          <Button type="button" size="lg" onClick={create} disabled={busy} className="self-start">
            {tokens.length ? "Criar outro token" : "Criar token para o atalho"}
          </Button>
        )}
      </div>
    </section>
  );
}
