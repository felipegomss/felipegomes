"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookmarkIcon, BotIcon, LoaderIcon, SearchIcon, SmartphoneIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDay } from "@/lib/format-date";
import { PLATFORM_LABELS, type Platform } from "@/lib/salvos/platforms";
import type { SavedLinkDTO } from "@/lib/salvos/service";
import { SalvoDialog } from "./salvo-dialog";

/** Cor de fundo da miniatura quando o link não tem imagem. */
const PLATFORM_BG: Record<Platform, string> = {
  tiktok: "bg-neutral-800",
  instagram: "bg-fuchsia-950",
  x: "bg-slate-800",
  youtube: "bg-red-950",
  web: "bg-emerald-950",
};

export function SalvosView({
  locale,
  items,
  total,
  stats,
  categories,
  tags,
  q,
  category,
  aiConfigured,
}: {
  locale: string;
  items: SavedLinkDTO[];
  total: number;
  stats: { total: number; week: number; categories: number };
  categories: { name: string; count: number }[];
  tags: string[];
  q: string;
  category: string | null;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [query, setQuery] = useState(q);
  const [open, setOpen] = useState<SavedLinkDTO | null>(null);
  const first = useRef(true);

  // Busca enquanto digita (com uma pequena espera).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set("q", query.trim());
      if (category !== null) sp.set("categoria", category);
      startTransition(() => router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(id);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const hrefFor = (cat: string | null) => {
    const sp = new URLSearchParams();
    if (query.trim()) sp.set("q", query.trim());
    if (cat !== null) sp.set("categoria", cat);
    return `${pathname}${sp.size ? `?${sp}` : ""}`;
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || saving) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/salvos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setMessage({ text: data?.error ?? "Não foi possível salvar.", error: true });
    const item = data.item as SavedLinkDTO;
    setUrl("");
    setMessage({
      text: data.duplicate
        ? `Já estava salvo${item.category ? ` em ${item.category}` : ""}.`
        : `Salvo${item.category ? ` em ${item.category}` : ""}${item.tags.length ? ` · ${item.tags.map((t) => `#${t}`).join(" ")}` : ""}.${data.warning ? ` ${data.warning}` : ""}`,
    });
    startTransition(() => router.refresh());
  }

  const noCategory = total > 0 && categories.reduce((s, c) => s + c.count, 0) < stats.total;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 text-xs max-md:pb-24">
      <section className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Salvos</h1>
        <p className="text-muted-foreground">
          {stats.total} {stats.total === 1 ? "link" : "links"}
          {stats.week > 0 && ` · ${stats.week} nesta semana`} · Pelo Claude: “salva esse link” ou “como faço aquela polenta que eu salvei?”
        </p>
      </section>

      {/* No celular o campo fica fixo no rodapé, perto do polegar. */}
      <form
        onSubmit={save}
        className="flex flex-col gap-1.5 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t max-md:bg-background max-md:px-4 max-md:pt-2.5 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="save-url" className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground max-md:sr-only">
          Salvar link
        </label>
        <div className="flex gap-2">
          <Input
            id="save-url"
            // Texto livre: ao compartilhar, o iPhone cola "Olha isso: https://…"; o servidor acha o link.
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole um link do TikTok, Instagram, X, YouTube ou qualquer site"
            className="h-11 flex-1 text-[13px] max-sm:text-base"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={saving || !url.trim()}
            aria-label="Salvar link"
            className="inline-flex h-11 items-center gap-2 bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50 max-sm:px-3"
          >
            {saving ? <LoaderIcon aria-hidden="true" className="size-4 animate-spin" /> : <BookmarkIcon aria-hidden="true" className="size-4" />}
            <span className="max-sm:sr-only">{saving ? "Lendo…" : "Salvar"}</span>
          </button>
        </div>
        <p aria-live="polite" className={cn("text-[11px]", message?.error ? "text-red-800 dark:text-red-400" : "text-muted-foreground", !message && "max-md:hidden")}>
          {message?.text ??
            (aiConfigured ? (
              "A IA lê o link e categoriza sozinha; você ajusta depois. No iPhone: Compartilhar › “Salvar no LFNG”."
            ) : (
              <>
                Sem IA configurada, o link entra sem categoria.{" "}
                <Link href={`/${locale}/admin/conta/integracoes`} className="underline underline-offset-2">
                  Configurar IA
                </Link>
              </>
            ))}
        </p>
      </form>

      <div className="flex flex-col gap-2.5">
        <label className="relative block">
          <span className="sr-only">Buscar nos salvos</span>
          <SearchIcon aria-hidden="true" className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: polenta, #airfryer, mobilidade…" className="h-10 pl-8 max-sm:h-11 max-sm:text-base" />
        </label>
        <nav aria-label="Categorias" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip href={hrefFor(null)} active={category === null}>
            Todas · {stats.total}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.name} href={hrefFor(c.name)} active={category === c.name}>
              {c.name} · {c.count}
            </Chip>
          ))}
          {noCategory && (
            <Chip href={hrefFor("")} active={category === ""}>
              Sem categoria
            </Chip>
          )}
        </nav>
      </div>

      {items.length === 0 ? (
        <p className="border border-dashed p-6 text-center text-muted-foreground">
          {q || category !== null ? "Nada encontrado." : "Nenhum link salvo ainda. Cole o primeiro acima ou mande pelo Claude."}
        </p>
      ) : (
        <>
          {(q || category !== null) && (
            <p className="text-[11px] text-muted-foreground" aria-live="polite">
              {total} {total === 1 ? "resultado" : "resultados"}
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] max-sm:gap-0 max-sm:border">
            {items.map((i) => (
              <li key={i.id} className="max-sm:border-b max-sm:last:border-b-0">
                <Card item={i} onOpen={() => setOpen(i)} />
              </li>
            ))}
          </ul>
        </>
      )}

      <SalvoDialog item={open} categories={categories.map((c) => c.name)} tags={tags} onClose={() => setOpen(null)} onChanged={(it) => setOpen(it)} />
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      scroll={false}
      className={cn(
        "inline-flex h-8 shrink-0 items-center border px-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 max-sm:h-9",
        active ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export function Thumb({ item, className }: { item: SavedLinkDTO; className?: string }) {
  const [broken, setBroken] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // Imagem que falhou antes de o React montar não dispara onError: confere aqui.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setBroken(true);
  }, []);
  return (
    <span className={cn("relative grid place-items-center overflow-hidden text-[10px] text-white/80", PLATFORM_BG[item.platform], className)}>
      {item.thumbnailUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniaturas externas de várias origens
        <img ref={imgRef} src={item.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span aria-hidden="true">{PLATFORM_LABELS[item.platform]}</span>
      )}
      <span className="absolute top-1.5 left-1.5 bg-black/70 px-1.5 py-px text-[10px] tracking-wide text-white uppercase">{PLATFORM_LABELS[item.platform]}</span>
    </span>
  );
}

function Card({ item: i, onOpen }: { item: SavedLinkDTO; onOpen: () => void }) {
  const title = i.title ?? i.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-full w-full text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
        "max-sm:gap-3 max-sm:px-3 max-sm:py-2.5 max-sm:hover:bg-muted/60",
        "sm:flex-col sm:border sm:bg-card sm:hover:border-foreground/40",
        i.status === "error" && "sm:border-dashed",
      )}
    >
      <Thumb item={i} className="shrink-0 max-sm:size-[72px] sm:aspect-[16/10] sm:w-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:p-3">
        <span className="line-clamp-2 text-[13px] leading-snug font-semibold">{title}</span>
        {i.summary && <span className="line-clamp-2 leading-relaxed text-muted-foreground max-sm:line-clamp-1">{i.summary}</span>}
        <span className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className={cn("border px-1.5", !i.category && "border-dashed text-muted-foreground")}>{i.category ?? "sem categoria"}</span>
          {i.tags.length > 0 && <span className="truncate text-muted-foreground">{i.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}</span>}
        </span>
        <span className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground max-sm:hidden">
          <span className="truncate">{i.author ?? ""}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {i.via === "agent" && <BotIcon aria-label="salvo pelo Claude" className="size-3" />}
            {i.via === "shortcut" && <SmartphoneIcon aria-label="salvo pelo atalho do iPhone" className="size-3" />}
            {formatDay(i.createdAt)}
          </span>
        </span>
      </span>
    </button>
  );
}
