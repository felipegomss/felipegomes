import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { rangeTitle, weekStart } from "@/lib/calendar/model";
import { CalendarError, listAgenda } from "@/lib/calendar/service";
import { GoogleAuthError, googleConfigured } from "@/lib/google/oauth";
import { addDays, isDayKey, todayKey } from "@/lib/tasks/model";
import { AgendaView, type AgendaViewMode } from "./_components/agenda-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agenda" };

const VIEWS: AgendaViewMode[] = ["dia", "semana", "lista"];

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ visao?: string; data?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const today = todayKey();
  const view: AgendaViewMode = VIEWS.includes(sp.visao as AgendaViewMode) ? (sp.visao as AgendaViewMode) : "semana";
  const anchor = isDayKey(sp.data) ? sp.data : today;
  const from = view === "semana" ? weekStart(anchor) : anchor;
  const to = view === "semana" ? addDays(from, 6) : view === "lista" ? addDays(from, 13) : from;

  let result: Awaited<ReturnType<typeof listAgenda>> | null = null;
  let error: { message: string; reconnect: boolean } | null = null;
  try {
    result = await listAgenda(from, to);
  } catch (e) {
    error = {
      message: e instanceof CalendarError || e instanceof GoogleAuthError ? e.message : "Falha ao falar com o Google Agenda.",
      reconnect: e instanceof GoogleAuthError,
    };
  }

  if (error || !result?.settings.connected) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 text-xs">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Agenda</h1>
        <section className="flex flex-col gap-3.5 border bg-card p-5">
          <h2 className="text-sm font-semibold">{error ? "Não deu para carregar a agenda" : "Conecte o Google Agenda"}</h2>
          <p className="leading-relaxed text-muted-foreground">
            {error
              ? error.message
              : "O app lê e cria eventos nas agendas que você escolher. Nada é copiado para o banco: a fonte continua sendo o Google."}
          </p>
          {!googleConfigured() ? (
            <p className="border border-dashed p-3 text-muted-foreground">
              Falta configurar <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> no servidor.
            </p>
          ) : (
            <a
              href="/api/google/connect"
              className="inline-flex h-11 items-center gap-2.5 self-start bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <CalendarIcon aria-hidden="true" className="size-4" />
              {error?.reconnect ? "Conectar de novo" : "Conectar com Google"}
            </a>
          )}
          <Link href={`/${locale}/admin/agenda/agendas`} className="self-start text-muted-foreground underline-offset-4 hover:underline">
            Agendas conectadas →
          </Link>
        </section>
      </div>
    );
  }

  return (
    <AgendaView
      locale={locale}
      view={view}
      anchor={anchor}
      from={from}
      to={to}
      today={today}
      title={rangeTitle(from, to)}
      items={result.items}
      settings={result.settings}
    />
  );
}
