"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  LoaderIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  ShareIcon,
  SquarePenIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/format-date";
import { PLATFORM_LABELS } from "@/lib/salvos/platforms";
import type { SavedLinkDTO } from "@/lib/salvos/service";
import { Thumb } from "./salvos-view";

const NEW = "__nova__";
const ICON_BTN = "grid size-11 place-items-center outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60";

type Tab = "resumo" | "descricao" | "transcricao";

export function SalvoDialog({
  item,
  categories,
  tags,
  onClose,
  onChanged,
}: {
  item: SavedLinkDTO | null;
  categories: string[];
  tags: string[];
  onClose: () => void;
  onChanged: (item: SavedLinkDTO) => void;
}) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden bg-background p-0 text-xs supports-backdrop-filter:bg-background max-md:text-sm sm:max-w-xl",
          // No celular vira uma tela inteira; no desktop, uma janela.
          "max-md:inset-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:border-0 md:max-h-[92dvh]",
        )}
      >
        {item && <SalvoDetail key={item.id} item={item} categories={categories} allTags={tags} onClose={onClose} onChanged={onChanged} />}
      </DialogContent>
    </Dialog>
  );
}

function SalvoDetail({
  item,
  categories,
  allTags,
  onClose,
  onChanged,
}: {
  item: SavedLinkDTO;
  categories: string[];
  allTags: string[];
  onClose: () => void;
  onChanged: (item: SavedLinkDTO) => void;
}) {
  const router = useRouter();
  const isVideo = item.platform === "tiktok" || item.platform === "instagram" || item.platform === "youtube";
  const [tab, setTab] = useState<Tab>(item.summary || item.details ? "resumo" : "descricao");
  const [busy, setBusy] = useState<null | "reprocess" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(item.title ?? "");
  const [namingCategory, setNamingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(item.note ?? "");
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  /** Cada mudança é gravada na hora; não há botão "Salvar". */
  async function patch(body: Record<string, unknown>, done: string) {
    setError(null);
    const res = await fetch(`/api/salvos/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Não foi possível salvar.");
      return false;
    }
    onChanged(data.item);
    setStatus(done);
    router.refresh();
    return true;
  }

  async function reprocess() {
    setBusy("reprocess");
    setError(null);
    const res = await fetch(`/api/salvos/${item.id}/reprocess`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setError(data?.error ?? "Não foi possível ler o link de novo.");
    if (data.warning) setError(data.warning);
    setTitle(data.item.title ?? "");
    onChanged(data.item);
    setStatus("Link lido de novo.");
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    const res = await fetch(`/api/salvos/${item.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      setConfirming(false);
      return setError("Não foi possível excluir.");
    }
    onClose();
    router.refresh();
  }

  async function share() {
    const data = { title: item.title ?? undefined, url: item.url };
    if (navigator.share) {
      await navigator.share(data).catch(() => null);
      return;
    }
    await copy(item.url, "Link copiado.");
  }

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(done);
    } catch {
      setError("Não foi possível copiar.");
    }
  }

  const cleanTag = (t: string) => t.replace(/^#+/, "").toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}_-]/gu, "");
  async function addTag(raw: string) {
    const t = cleanTag(raw);
    setTagInput("");
    if (t && !item.tags.includes(t)) await patch({ tags: [...item.tags, t] }, `Tag #${t} adicionada.`);
  }
  const prefix = cleanTag(tagInput);
  const suggestions = allTags.filter((t) => !item.tags.includes(t) && (!prefix || t.startsWith(prefix))).slice(0, 6);
  const categoryOptions = item.category && !categories.includes(item.category) ? [item.category, ...categories] : categories;

  const where = PLATFORM_LABELS[item.platform] === "Web" ? "site" : PLATFORM_LABELS[item.platform];
  const via = item.via === "agent" ? " · pelo Claude" : item.via === "shortcut" ? " · pelo iPhone" : "";
  const tabs: { id: Tab; label: string }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "descricao", label: item.platform === "web" ? "Texto" : "Descrição" },
    ...(isVideo ? [{ id: "transcricao" as const, label: "Transcrição" }] : []),
  ];
  const resumoText = [item.summary, item.details].filter(Boolean).join("\n\n");
  const panelText = tab === "resumo" ? resumoText : tab === "descricao" ? (item.content ?? "") : (item.transcript ?? "");

  return (
    <>
      <header className="flex shrink-0 items-center justify-between border-b pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onClose} className={cn(ICON_BTN, "w-auto grid-flow-col gap-1 pr-3 pl-2")}>
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          Voltar
        </button>
        <div className="flex">
          <button type="button" onClick={share} aria-label="Compartilhar link" className={ICON_BTN}>
            <ShareIcon aria-hidden="true" className="size-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Mais ações" className={ICON_BTN}>
                {busy === "reprocess" ? <LoaderIcon aria-hidden="true" className="size-4 animate-spin" /> : <MoreHorizontalIcon aria-hidden="true" className="size-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="h-11 gap-2.5" onSelect={() => setEditingTitle(true)}>
                <PencilIcon aria-hidden="true" className="size-3.5" />
                Editar título
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11 gap-2.5" onSelect={() => copy(item.url, "Link copiado.")}>
                <CopyIcon aria-hidden="true" className="size-3.5" />
                Copiar link
              </DropdownMenuItem>
              <DropdownMenuItem className="h-11 gap-2.5" disabled={!!busy} onSelect={reprocess}>
                <RefreshCwIcon aria-hidden="true" className="size-3.5" />
                Ler o link de novo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="h-11 gap-2.5 text-red-700 focus:text-red-800 dark:text-red-400" onSelect={() => setConfirming(true)}>
                <Trash2Icon aria-hidden="true" className="size-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 pb-28">
        <Thumb item={item} className="mx-auto aspect-[3/4] w-[56%] max-w-60 shrink-0" />

        {/* Categoria: um seletor com cara de etiqueta. */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex h-9 items-center gap-1.5 border bg-muted/60 max-md:h-11 pr-2 pl-3 font-medium focus-within:ring-2 focus-within:ring-ring/60">
            <span className="sr-only">Categoria</span>
            <span aria-hidden="true" className={cn(!item.category && "text-muted-foreground")}>
              {item.category ?? "Sem categoria"}
            </span>
            <ChevronsUpDownIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
            <select
              value={item.category ?? ""}
              onChange={(e) => {
                if (e.target.value === NEW) return setNamingCategory(true);
                void patch({ category: e.target.value || null }, e.target.value ? `Categoria: ${e.target.value}.` : "Sem categoria.");
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">Sem categoria</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={NEW}>+ Nova categoria…</option>
            </select>
          </label>
          {namingCategory && (
            <form
              className="flex flex-1 gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCategory.trim()) return;
                if (await patch({ category: newCategory.trim() }, `Categoria: ${newCategory.trim()}.`)) {
                  setNamingCategory(false);
                  setNewCategory("");
                }
              }}
            >
              <Input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nome da categoria" aria-label="Nome da nova categoria" className="h-9 min-w-0 flex-1 max-md:h-11 max-sm:text-base" />
              <Button type="submit" size="lg" className="h-9 max-md:h-11">
                Criar
              </Button>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {editingTitle ? (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await patch({ title: title || item.url }, "Título salvo.")) setEditingTitle(false);
              }}
            >
              <DialogTitle className="sr-only">Editar título</DialogTitle>
              <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título" className="h-11 min-w-0 flex-1 max-sm:text-base" />
              <Button type="submit" size="lg" className="h-11">
                Salvar
              </Button>
            </form>
          ) : (
            <DialogTitle className="font-heading text-xl leading-snug font-semibold tracking-tight">{item.title ?? "Sem título"}</DialogTitle>
          )}
          <DialogDescription className="text-xs text-muted-foreground max-md:text-sm">
            {[PLATFORM_LABELS[item.platform], item.author, `salvo em ${formatDay(item.createdAt)}${via}`].filter(Boolean).join(" · ")}
          </DialogDescription>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {item.tags.map((t) => (
            <span key={t} className="inline-flex h-8 items-center bg-muted pl-2.5 max-md:h-10">
              #{t}
              <button
                type="button"
                aria-label={`Remover #${t}`}
                onClick={() => patch({ tags: item.tags.filter((x) => x !== t) }, `Tag #${t} removida.`)}
                className="grid size-8 place-items-center text-muted-foreground hover:text-foreground max-md:size-10"
              >
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            </span>
          ))}
          {addingTag ? (
            <form
              className="flex min-w-40 flex-1 gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void addTag(tagInput);
              }}
            >
              <Input
                autoFocus
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={() => !tagInput && setAddingTag(false)}
                placeholder="#tag"
                aria-label="Nova tag"
                autoCapitalize="none"
                className="h-8 min-w-0 flex-1 max-md:h-10 max-sm:text-base"
              />
            </form>
          ) : (
            <button type="button" onClick={() => setAddingTag(true)} className="inline-flex h-8 items-center gap-1 border border-dashed px-2.5 text-muted-foreground hover:text-foreground max-md:h-10">
              <PlusIcon aria-hidden="true" className="size-3" />
              tag
            </button>
          )}
          {addingTag && suggestions.length > 0 && (
            <div className="flex w-full flex-wrap gap-1.5">
              {suggestions.map((t) => (
                // onMouseDown: o toque na sugestão não pode tirar o foco do campo antes.
                <button key={t} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(t)} className="h-8 border px-2.5 text-muted-foreground hover:text-foreground max-md:h-10">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {editingNote ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await patch({ note }, note.trim() ? "Nota salva." : "Nota removida.")) setEditingNote(false);
            }}
          >
            <Textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3} aria-label="Minha nota" placeholder="O que você quer lembrar sobre este link" className="max-sm:text-base" />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setNote(item.note ?? "");
                  setEditingNote(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" size="lg">
                Salvar nota
              </Button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setEditingNote(true)} className="flex min-h-12 items-start gap-2.5 border bg-muted/40 px-3.5 py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60">
            <SquarePenIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {item.note ? <span className="whitespace-pre-line">{item.note}</span> : <span className="text-muted-foreground">Adicionar nota</span>}
          </button>
        )}

        {item.status === "error" && item.error && <p className="border border-amber-500/40 bg-amber-500/5 p-2.5 text-amber-900 dark:text-amber-200">{item.error}</p>}
        {error && (
          <p role="alert" className="text-red-800 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div role="tablist" aria-label="Conteúdo do link" className="grid auto-cols-fr grid-flow-col bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`sv-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="sv-panel"
                onClick={() => setTab(t.id)}
                className={cn("h-9 outline-none max-md:h-10 focus-visible:ring-2 focus-visible:ring-ring/60", tab === t.id ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="sv-panel" aria-labelledby={`sv-tab-${tab}`} className="flex flex-col gap-3 border p-3.5">
            {panelText ? (
              <>
                <button
                  type="button"
                  onClick={() => copy(panelText, "Texto copiado.")}
                  className="inline-flex h-9 items-center gap-1.5 self-end border px-2.5 max-md:h-10 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <CopyIcon aria-hidden="true" className="size-3.5" />
                  Copiar
                </button>
                {tab === "resumo" ? (
                  <>
                    {item.summary && <p className="text-sm leading-relaxed">{item.summary}</p>}
                    {item.details && <Details text={item.details} />}
                  </>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line">{panelText}</p>
                )}
                {tab === "transcricao" && <p className="text-muted-foreground">Legenda automática do {where}: pode ter palavras trocadas.</p>}
              </>
            ) : (
              <Empty tab={tab} item={item} where={where} busy={busy === "reprocess"} onReprocess={reprocess} />
            )}
          </div>
        </div>
      </div>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="sv-del"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              setConfirming(false);
            }
          }}
          className="flex shrink-0 flex-col gap-2.5 border-t border-red-500/40 bg-red-500/5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <p id="sv-del" className="font-semibold">
            Excluir este link dos salvos?
          </p>
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} type="button" variant="outline" size="lg" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" size="lg" disabled={!!busy} onClick={remove} className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950 dark:hover:bg-red-300">
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 inline-flex h-12 -translate-x-1/2 items-center gap-2 bg-primary px-6 text-sm whitespace-nowrap font-semibold text-primary-foreground shadow-lg shadow-black/40 outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir no {where}
          <ExternalLinkIcon aria-hidden="true" className="size-4" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      )}

      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </>
  );
}

/** Resumo longo da IA: linhas com "- " viram lista; as demais, subtítulos. */
function Details({ text }: { text: string }) {
  const blocks: { title: string | null; items: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!blocks.length) blocks.push({ title: null, items: [] });
      blocks.at(-1)!.items.push(bullet[1]);
    } else blocks.push({ title: line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, ""), items: [] });
  }
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {blocks.map((b, i) => (
        <section key={i} className="flex flex-col gap-1.5">
          {b.title && (b.items.length ? <h3 className="font-semibold">{b.title}</h3> : <p>{b.title}</p>)}
          {b.items.length > 0 && (
            <ul className="flex flex-col gap-1">
              {b.items.map((it, j) => (
                <li key={j} className="grid grid-cols-[14px_minmax(0,1fr)]">
                  <span aria-hidden="true" className="text-muted-foreground">
                    ·
                  </span>
                  {it.replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function Empty({ tab, item, where, busy, onReprocess }: { tab: Tab; item: SavedLinkDTO; where: string; busy: boolean; onReprocess: () => void }) {
  const text =
    tab === "resumo"
      ? "Sem resumo ainda. Ele aparece quando a IA está configurada e o link tem texto para ler."
      : tab === "descricao"
        ? "Não consegui ler o texto deste link."
        : item.platform === "tiktok"
          ? "Este vídeo não tem legenda automática no TikTok (sem fala, só música, ou o autor desligou)."
          : `Ainda não dá para transcrever vídeos do ${where}: a plataforma não entrega o áudio nem a legenda para o app.`;
  const canRetry = tab !== "transcricao" || item.platform === "tiktok";
  return (
    <div className="flex flex-col items-start gap-3 text-muted-foreground">
      <p className="leading-relaxed">{text}</p>
      {canRetry && (
        <button type="button" onClick={onReprocess} disabled={busy} className="inline-flex h-9 items-center gap-1.5 border px-2.5 max-md:h-11 text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50">
          {busy ? <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" /> : <RefreshCwIcon aria-hidden="true" className="size-3.5" />}
          Ler o link de novo
        </button>
      )}
    </div>
  );
}
