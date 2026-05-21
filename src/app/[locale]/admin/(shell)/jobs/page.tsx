"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  RefreshCwIcon,
  PlayIcon,
  ExternalLinkIcon,
  MailIcon,
  PhoneIcon,
  StarIcon,
  CheckIcon,
  XIcon,
  RotateCcwIcon,
  BriefcaseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  JOB_SOURCES,
  JOB_STATUSES,
  type JobStatus,
  type JobSource,
} from "@/lib/db/schema";

type Job = {
  id: string;
  url: string;
  source: JobSource;
  type: "post" | "job";
  title: string | null;
  body: string;
  company: string | null;
  location: string | null;
  authorName: string | null;
  authorUrl: string | null;
  postedAt: string | null;
  scrapedAt: string;
  status: JobStatus;
  starred: boolean;
  contactedAt: string | null;
  matchedKeywords: string[] | null;
  contactEmails: string[] | null;
  contactWhatsapps: string[] | null;
};

type ListResponse = {
  data: Job[];
  total: number;
  limit: number;
  offset: number;
};

type ScrapeReport = {
  source: JobSource;
  ok: boolean;
  error?: string;
  result?: { received: number; relevant: number; inserted: number; skipped: number; rejected: number; tooOld: number };
};

type ScrapeResponse = {
  totals: { received: number; relevant: number; inserted: number; skipped: number; rejected: number; tooOld: number };
  reports: ScrapeReport[];
};

const STATUS_LABELS: Record<JobStatus, string> = {
  new: "Novos",
  contacted: "Contatados",
  dismissed: "Dispensados",
};

const SOURCE_LABELS: Record<JobSource, string> = {
  "github-frontendbr": "frontendbr",
  "github-backendbr": "backend-br",
  "github-react-brasil": "react-brasil",
  remoteok: "RemoteOK",
  "hn-hiring": "HN Hiring",
  "vagas-com-br": "vagas.com.br",
  coodesh: "Coodesh",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  new: "bg-sky-500/10 text-sky-500",
  contacted: "bg-emerald-500/10 text-emerald-500",
  dismissed: "bg-muted text-muted-foreground",
};

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function formatDate(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_PT[date.getMonth()];
  return `${day} ${month}`;
}

export default function JobsPage() {
  const { locale } = useParams<{ locale: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<JobStatus>("new");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ status: statusFilter, limit: "50" });
    if (sourceFilter !== "all") p.set("source", sourceFilter);
    if (starredOnly) p.set("starred", "1");
    if (debouncedQ) p.set("q", debouncedQ);
    return p;
  }, [statusFilter, sourceFilter, starredOnly, debouncedQ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/list?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = `/${locale}/admin/login`;
        return;
      }
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Erro.");
      const data = (await res.json()) as ListResponse;
      setJobs(data.data);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }, [params, locale]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = new URLSearchParams(params);
      next.set("offset", String(jobs.length));
      const res = await fetch(`/api/jobs/list?${next.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar mais.");
      const data = (await res.json()) as ListResponse;
      setJobs((prev) => [...prev, ...data.data]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function runScrape() {
    setScraping(true);
    setError(null);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/jobs/scrape", { method: "POST" });
      if (res.status === 401) {
        window.location.href = `/${locale}/admin/login`;
        return;
      }
      if (!res.ok) throw new Error("Erro no scrape.");
      const result = (await res.json()) as ScrapeResponse;
      setScrapeResult(result);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setScraping(false);
    }
  }

  async function patchJob(
    id: string,
    updates: { status?: JobStatus; starred?: boolean },
  ): Promise<Job | null> {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Erro ao atualizar.");
      const data = (await res.json()) as { data: Job };
      return data.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
      return null;
    }
  }

  async function updateStatus(id: string, status: JobStatus) {
    const updated = await patchJob(id, { status });
    if (!updated) return;
    setJobs((prev) =>
      statusFilter === status
        ? prev.map((j) => (j.id === id ? updated : j))
        : prev.filter((j) => j.id !== id),
    );
    if (selectedJob?.id === id) {
      if (statusFilter !== status) setSelectedJob(null);
      else setSelectedJob(updated);
    }
  }

  async function toggleStarred(id: string, starred: boolean) {
    const updated = await patchJob(id, { starred });
    if (!updated) return;
    // If filtering starredOnly and removing star, drop from list. Otherwise update inline.
    setJobs((prev) =>
      starredOnly && !starred
        ? prev.filter((j) => j.id !== id)
        : prev.map((j) => (j.id === id ? updated : j)),
    );
    if (selectedJob?.id === id) setSelectedJob(updated);
  }

  const hasMore = jobs.length < total;

  return (
    <div className="flex flex-col gap-4">
      {/* Title + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Vagas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
          <Button size="sm" onClick={runScrape} disabled={scraping}>
            <PlayIcon className={cn("size-3.5", scraping && "animate-pulse")} />
            {scraping ? "Buscando..." : "Buscar agora"}
          </Button>
        </div>
      </div>

      {/* Scrape result summary */}
      {scrapeResult && (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-medium">Última busca:</span>
            <span className="text-muted-foreground">
              {scrapeResult.totals.received} coletados · {scrapeResult.totals.relevant} relevantes · <span className="text-foreground">{scrapeResult.totals.inserted} novos</span> · {scrapeResult.totals.skipped} duplicados · {scrapeResult.totals.rejected} filtrados · {scrapeResult.totals.tooOld} antigos (&gt;30d)
            </span>
          </div>
          {scrapeResult.reports.some((r) => !r.ok) && (
            <div className="mt-1 text-destructive">
              Erros: {scrapeResult.reports.filter((r) => !r.ok).map((r) => `${SOURCE_LABELS[r.source]} (${r.error})`).join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus)}>
          <TabsList>
            {JOB_STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {STATUS_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant={starredOnly ? "default" : "outline"}
          onClick={() => setStarredOnly((v) => !v)}
          aria-pressed={starredOnly}
        >
          <StarIcon className={cn("size-3.5", starredOnly && "fill-current")} />
          Favoritas
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou conteúdo"
            className="max-w-sm"
          />
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {JOB_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[28px_1fr_140px_80px_100px] gap-3 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <div></div>
          <div>Título / Empresa</div>
          <div>Fonte</div>
          <div>Contatos</div>
          <div className="text-right">
            {statusFilter === "contacted" ? "Contatada" : "Posted"}
          </div>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_140px_80px_100px] items-center gap-3 px-3 py-3">
                <Skeleton className="size-4" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="ml-auto h-3 w-16" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <BriefcaseIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              {debouncedQ || sourceFilter !== "all"
                ? "Nenhuma vaga encontrada com esses filtros."
                : `Nenhuma vaga ${STATUS_LABELS[statusFilter].toLowerCase()}.`}
            </p>
            {statusFilter === "new" && (
              <p className="text-xs text-muted-foreground">
                Clique em &quot;Buscar agora&quot; pra coletar das fontes públicas.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {jobs.map((job) => {
              const hasEmail = (job.contactEmails?.length ?? 0) > 0;
              const hasWpp = (job.contactWhatsapps?.length ?? 0) > 0;
              return (
                <div
                  key={job.id}
                  className="grid grid-cols-[28px_1fr_140px_80px_100px] items-center gap-3 px-3 py-3 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarred(job.id, !job.starred);
                    }}
                    className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
                    aria-label={job.starred ? "Desfavoritar" : "Favoritar"}
                  >
                    <StarIcon
                      className={cn(
                        "size-3.5",
                        job.starred && "fill-amber-500 text-amber-500",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="min-w-0 text-left"
                  >
                    <div className="truncate font-medium">
                      {job.title || <span className="italic text-muted-foreground">(sem título)</span>}
                    </div>
                    {(job.company || job.location) && (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {[job.company, job.location].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="truncate text-left text-muted-foreground"
                  >
                    {SOURCE_LABELS[job.source]}
                  </button>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    {hasEmail && <MailIcon className="size-3.5 text-emerald-500" aria-label="email" />}
                    {hasWpp && <PhoneIcon className="size-3.5 text-emerald-500" aria-label="whatsapp" />}
                    {!hasEmail && !hasWpp && <span className="text-muted-foreground/40">—</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="text-right text-muted-foreground tabular-nums whitespace-nowrap"
                    title={
                      statusFilter === "contacted" && job.contactedAt
                        ? new Date(job.contactedAt).toLocaleString("pt-BR")
                        : job.postedAt
                          ? new Date(job.postedAt).toLocaleString("pt-BR")
                          : undefined
                    }
                  >
                    {formatDate(
                      statusFilter === "contacted" ? job.contactedAt : job.postedAt,
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Carregando..." : `Carregar mais (${total - jobs.length} restantes)`}
          </Button>
        </div>
      )}

      {/* Detail modal */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedJob && (
            <>
              <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
                <DialogTitle className="pr-6 text-left text-base">
                  {selectedJob.title || "(sem título)"}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-left">
                  <Badge variant="outline" className={cn(STATUS_COLORS[selectedJob.status])}>
                    {STATUS_LABELS[selectedJob.status]}
                  </Badge>
                  <span className="text-xs">{SOURCE_LABELS[selectedJob.source]}</span>
                  {selectedJob.company && <span className="text-xs">· {selectedJob.company}</span>}
                  {selectedJob.location && <span className="text-xs">· {selectedJob.location}</span>}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 px-6 py-4 overflow-y-auto">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={selectedJob.url} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon className="size-3.5" />
                      Abrir original
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStarred(selectedJob.id, !selectedJob.starred)}
                  >
                    <StarIcon
                      className={cn(
                        "size-3.5",
                        selectedJob.starred && "fill-amber-500 text-amber-500",
                      )}
                    />
                    {selectedJob.starred ? "Desfavoritar" : "Favoritar"}
                  </Button>
                  {selectedJob.status !== "contacted" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(selectedJob.id, "contacted")}>
                      <CheckIcon className="size-3.5" /> Marcar contatado
                    </Button>
                  )}
                  {selectedJob.status !== "dismissed" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(selectedJob.id, "dismissed")}>
                      <XIcon className="size-3.5" /> Dispensar
                    </Button>
                  )}
                  {selectedJob.status !== "new" && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(selectedJob.id, "new")}>
                      <RotateCcwIcon className="size-3.5" /> Voltar pra novos
                    </Button>
                  )}
                </div>

                {selectedJob.contactedAt && (
                  <div className="text-[11px] text-muted-foreground">
                    Contatada em {new Date(selectedJob.contactedAt).toLocaleString("pt-BR")}
                  </div>
                )}

                {/* Contacts */}
                {((selectedJob.contactEmails?.length ?? 0) > 0 ||
                  (selectedJob.contactWhatsapps?.length ?? 0) > 0) && (
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                    <div className="mb-1 font-medium uppercase tracking-widest text-muted-foreground text-[10px]">
                      Contatos
                    </div>
                    {selectedJob.contactEmails?.map((e) => (
                      <div key={e} className="flex items-center gap-1.5">
                        <MailIcon className="size-3 text-muted-foreground" />
                        <a href={`mailto:${e}`} className="hover:underline">{e}</a>
                      </div>
                    ))}
                    {selectedJob.contactWhatsapps?.map((w) => (
                      <div key={w} className="flex items-center gap-1.5">
                        <PhoneIcon className="size-3 text-muted-foreground" />
                        <a
                          href={`https://wa.me/${w.replace("+", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {w}
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Matched keywords */}
                {selectedJob.matchedKeywords && selectedJob.matchedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.matchedKeywords.map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">
                        {k}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Body */}
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => (
                        <a {...props} target="_blank" rel="noreferrer" />
                      ),
                    }}
                  >
                    {selectedJob.body}
                  </ReactMarkdown>
                </div>

                {/* Author */}
                {selectedJob.authorName && (
                  <div className="text-[11px] text-muted-foreground">
                    Posted por{" "}
                    {selectedJob.authorUrl ? (
                      <a href={selectedJob.authorUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {selectedJob.authorName}
                      </a>
                    ) : (
                      selectedJob.authorName
                    )}
                    {selectedJob.postedAt && <> · {new Date(selectedJob.postedAt).toLocaleString("pt-BR")}</>}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
