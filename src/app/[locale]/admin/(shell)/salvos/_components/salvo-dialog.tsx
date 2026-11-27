"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, LoaderIcon, RefreshCwIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/format-date";
import { PLATFORM_LABELS } from "@/lib/salvos/platforms";
import type { SavedLinkDTO } from "@/lib/salvos/service";
import { LABEL } from "../../../../pets/[slug]/_components/shared";
import { Thumb } from "./salvos-view";

const FIELD = "h-11 border-muted-foreground/70 dark:border-muted-foreground/70";
const NEW = "__nova__";

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
      <DialogContent className="max-h-[92dvh] overflow-y-auto text-xs sm:max-w-xl">
        {item && <SalvoForm key={`${item.id}:${item.title}:${item.category}`} item={item} categories={categories} allTags={tags} onClose={onClose} onChanged={onChanged} />}
      </DialogContent>
    </Dialog>
  );
}

function SalvoForm({
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
  const [title, setTitle] = useState(item.title ?? "");
  const [category, setCategory] = useState(item.category ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [tags, setTags] = useState(item.tags);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState(item.note ?? "");
  const [busy, setBusy] = useState<null | "save" | "reprocess" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const cleanTag = (t: string) => t.replace(/^#+/, "").toLowerCase().replace(/\s+/g, "").replace(/[^\p{L}\p{N}_-]/gu, "");
  const addTag = (raw: string) => {
    const t = cleanTag(raw);
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const prefix = cleanTag(tagInput);
  const suggestions = allTags.filter((t) => !tags.includes(t) && (!prefix || t.startsWith(prefix))).slice(0, 6);
  const categoryOptions = item.category && !categories.includes(item.category) ? [item.category, ...categories] : categories;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const finalCategory = category === NEW ? newCategory.trim() : category;
    if (category === NEW && !finalCategory) return setError("Dê um nome à nova categoria.");
    setBusy("save");
    setError(null);
    const pending = tagInput.trim() ? [...tags, cleanTag(tagInput)] : tags;
    const res = await fetch(`/api/salvos/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title || item.url, category: finalCategory || null, tags: pending, note }),
    });
    setBusy(null);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? "Não foi possível salvar.");
    onClose();
    router.refresh();
  }

  async function reprocess() {
    setBusy("reprocess");
    setError(null);
    const res = await fetch(`/api/salvos/${item.id}/reprocess`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setError(data?.error ?? "Não foi possível reprocessar.");
    if (data.warning) setError(data.warning);
    onChanged(data.item);
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

  const via = item.via === "agent" ? " · pelo Claude" : item.via === "shortcut" ? " · pelo iPhone" : "";

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 pr-6 sm:grid-cols-[128px_minmax(0,1fr)]">
        <Thumb item={item} className="aspect-[9/16] w-full" />
        <div className="flex min-w-0 flex-col gap-2">
          <DialogHeader className="text-left">
            <DialogTitle className="font-heading text-base leading-snug">{item.title ?? "Sem título"}</DialogTitle>
            <DialogDescription className="text-[11px]">
              {[item.author, `salvo ${formatDay(item.createdAt)}${via}`].filter(Boolean).join(" · ")}
            </DialogDescription>
          </DialogHeader>
          <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1.5 self-start underline-offset-4 hover:underline">
            Abrir no {PLATFORM_LABELS[item.platform] === "Web" ? "site" : PLATFORM_LABELS[item.platform]}
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
            <span className="sr-only">(abre em nova aba)</span>
          </a>
          {item.summary && (
            <div className="mt-auto flex flex-col gap-1 border p-2.5">
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Resumo da IA</span>
              <p className="leading-relaxed">{item.summary}</p>
            </div>
          )}
        </div>
      </div>

      {item.status === "error" && item.error && <p className="border border-amber-500/40 bg-amber-500/5 p-2.5 text-amber-900 dark:text-amber-200">{item.error}</p>}

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Título</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className={cn(FIELD, "max-sm:text-base")} />
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sv-cat" className={LABEL}>
          Categoria
        </label>
        <select id="sv-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={cn(FIELD, "border bg-background px-2.5")}>
          <option value="">Sem categoria</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={NEW}>+ Nova categoria…</option>
        </select>
        {category === NEW && (
          <Input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nome da categoria" aria-label="Nome da nova categoria" className={cn(FIELD, "max-sm:text-base")} />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sv-tag" className={LABEL}>
          Tags
        </label>
        <div className="flex min-h-11 flex-wrap items-center gap-1.5 border border-muted-foreground/70 px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring/50">
          {tags.map((t) => (
            <span key={t} className="inline-flex h-7 items-center gap-0.5 bg-muted pr-0.5 pl-2">
              #{t}
              <button type="button" aria-label={`Remover #${t}`} onClick={() => setTags(tags.filter((x) => x !== t))} className="grid size-6 place-items-center text-muted-foreground hover:text-foreground">
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            </span>
          ))}
          <input
            id="sv-tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "," || e.key === " ") {
                if (tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              } else if (e.key === "Backspace" && !tagInput && tags.length) setTags(tags.slice(0, -1));
            }}
            placeholder={tags.length ? "" : "#adicionar"}
            className="h-7 min-w-24 flex-1 bg-transparent outline-none max-sm:text-base"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>Sugestões:</span>
            {suggestions.map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)} className="min-h-6 underline underline-offset-2 hover:text-foreground">
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Minha nota</span>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Opcional — ex.: o que só é falado no vídeo" className="border-muted-foreground/70" />
      </label>

      {item.content && (
        <details className="border">
          <summary className="flex min-h-11 cursor-pointer items-center px-3 text-muted-foreground">Conteúdo salvo · usado na busca e pelo Claude</summary>
          <p className="max-h-64 overflow-y-auto px-3 pb-3 leading-relaxed whitespace-pre-line text-muted-foreground">{item.content}</p>
        </details>
      )}

      {error && (
        <p role="alert" className="text-red-800 dark:text-red-400">
          {error}
        </p>
      )}

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
          className="flex flex-col gap-2.5 border border-red-500/40 bg-red-500/5 p-3"
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
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="button" variant="ghost" size="lg" onClick={() => setConfirming(true)} className="gap-1.5 px-2 text-red-700 hover:text-red-800 dark:text-red-400">
            <Trash2Icon aria-hidden="true" className="size-3.5" />
            Excluir
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={reprocess} disabled={!!busy} className="gap-1.5">
            {busy === "reprocess" ? <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" /> : <RefreshCwIcon aria-hidden="true" className="size-3.5" />}
            Reprocessar
          </Button>
          <Button type="button" variant="outline" size="lg" className="ml-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={!!busy}>
            Salvar
          </Button>
        </div>
      )}
    </form>
  );
}
