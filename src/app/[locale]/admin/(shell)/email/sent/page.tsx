"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCwIcon, InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LastEvent =
  | "bounced"
  | "canceled"
  | "clicked"
  | "complained"
  | "delivered"
  | "delivery_delayed"
  | "failed"
  | "opened"
  | "queued"
  | "scheduled"
  | "sent";

type SentEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  last_event: LastEvent;
};

type ListResponse = {
  data: SentEmail[];
  hasMore: boolean;
};

const STATUS_STYLES: Record<LastEvent, { label: string; className: string }> = {
  delivered: { label: "Entregue", className: "bg-emerald-500/10 text-emerald-500" },
  sent: { label: "Enviado", className: "bg-emerald-500/10 text-emerald-500" },
  opened: { label: "Aberto", className: "bg-sky-500/10 text-sky-500" },
  clicked: { label: "Clicado", className: "bg-sky-500/10 text-sky-500" },
  queued: { label: "Na fila", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Agendado", className: "bg-muted text-muted-foreground" },
  delivery_delayed: { label: "Atrasado", className: "bg-amber-500/10 text-amber-500" },
  bounced: { label: "Bounce", className: "bg-destructive/10 text-destructive" },
  complained: { label: "Spam", className: "bg-destructive/10 text-destructive" },
  failed: { label: "Falhou", className: "bg-destructive/10 text-destructive" },
  canceled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
};

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function formatDate(iso: string) {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_PT[date.getMonth()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${hh}:${mm}`;
}

function formatRecipients(to: string[]) {
  if (to.length === 0) return "—";
  if (to.length === 1) return to[0];
  return `${to[0]} +${to.length - 1}`;
}

export default function SentEmailsPage() {
  const { locale } = useParams<{ locale: string }>();
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(
    async (after?: string) => {
      const params = new URLSearchParams({ limit: "50" });
      if (after) params.set("after", after);
      const res = await fetch(`/api/email/list?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = `/${locale}/admin/login`;
        return null;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao carregar emails.");
      }
      return (await res.json()) as ListResponse;
    },
    [locale],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchList();
      if (res) {
        setEmails(res.data);
        setHasMore(res.hasMore);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  async function loadMore() {
    if (emails.length === 0) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await fetchList(emails[emails.length - 1].id);
      if (res) {
        setEmails((prev) => [...prev, ...res.data]);
        setHasMore(res.hasMore);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Emails enviados
          </h1>
          <p className="text-sm text-muted-foreground">
            Histórico dos envios pela API do Resend.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          aria-label="Atualizar"
        >
          <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="grid grid-cols-[1fr_2fr_110px_120px] gap-3 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          <div>Para</div>
          <div>Assunto</div>
          <div>Status</div>
          <div className="text-right">Data</div>
        </div>

        {loading && emails.length === 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_2fr_110px_120px] items-center gap-3 px-3 py-2.5"
              >
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="ml-auto h-3 w-20" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">Nenhum email enviado ainda.</p>
            <p className="text-xs text-muted-foreground">
              Envie o primeiro pela aba Compor.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {emails.map((email) => {
              const status = STATUS_STYLES[email.last_event] ?? {
                label: email.last_event,
                className: "bg-muted text-muted-foreground",
              };
              return (
                <div
                  key={email.id}
                  className="grid grid-cols-[1fr_2fr_110px_120px] items-center gap-3 px-3 py-2.5 text-xs transition-colors hover:bg-muted/40"
                >
                  <div className="truncate text-muted-foreground" title={email.to.join(", ")}>
                    {formatRecipients(email.to)}
                  </div>
                  <div className="truncate font-medium" title={email.subject}>
                    {email.subject || <span className="text-muted-foreground italic">(sem assunto)</span>}
                  </div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    className="text-right text-muted-foreground tabular-nums whitespace-nowrap"
                    title={new Date(email.created_at).toLocaleString("pt-BR")}
                  >
                    {formatDate(email.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
