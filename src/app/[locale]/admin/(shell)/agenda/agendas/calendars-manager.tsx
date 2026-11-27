"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/format-date";
import type { AgendaSettings } from "@/lib/calendar/service";

const LEGEND = "mb-2 p-0 text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

export function CalendarsManager({
  settings,
  configured,
  error,
  justConnected,
}: {
  settings: AgendaSettings | null;
  configured: boolean;
  error: string | null;
  justConnected: boolean;
}) {
  const router = useRouter();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(justConnected ? "Google conectado." : null);
  const [confirming, setConfirming] = useState(false);

  async function save(patch: Partial<{ visible: string[]; defaultId: string; showTasks: boolean }>) {
    if (!s) return;
    const prev = s;
    // Otimista: marca na hora, o servidor confirma.
    setS({
      ...s,
      showTasks: patch.showTasks ?? s.showTasks,
      defaultId: patch.defaultId ?? s.defaultId,
      calendars: patch.visible ? s.calendars.map((c) => ({ ...c, visible: patch.visible!.includes(c.id) })) : s.calendars,
    });
    const res = await fetch("/api/calendar/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) {
      setS(prev);
      setMsg((await res.json().catch(() => null))?.error ?? "Não foi possível salvar.");
      return;
    }
    setS(await res.json());
    setMsg("Salvo.");
    router.refresh();
  }

  async function disconnect() {
    setBusy(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    setBusy(false);
    setConfirming(false);
    setS((cur) => (cur ? { ...cur, connected: false, calendars: [] } : cur));
    router.refresh();
  }

  const connected = !!s?.connected;
  const visibleIds = s?.calendars.filter((c) => c.visible).map((c) => c.id) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 text-xs">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Agendas</h1>
      {error && (
        <p role="alert" className="border border-red-500/40 bg-red-500/5 p-3 text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {msg}
      </p>

      {!connected ? (
        <section className="flex flex-col gap-3.5 border bg-card p-5">
          <h2 className="text-sm font-semibold">Conecte o Google Agenda</h2>
          <p className="leading-relaxed text-muted-foreground">
            O app lê e cria eventos nas agendas que você escolher. Nada é copiado para o banco: a fonte continua sendo o Google, e dá para desconectar a qualquer momento.
          </p>
          {configured ? (
            <a href="/api/google/connect" className="inline-flex h-11 items-center gap-2.5 self-start bg-primary px-4 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/60">
              <CalendarIcon aria-hidden="true" className="size-4" />
              Conectar com Google
            </a>
          ) : (
            <p className="border border-dashed p-3 text-muted-foreground">
              Falta configurar <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> no servidor.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">Permissão pedida: ver suas agendas e editar eventos. Nada de Gmail, Drive ou contatos.</p>
        </section>
      ) : (
        <section className="flex flex-col border bg-card">
          <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3.5">
            <span className="size-2 bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">Google conectado</span>
              <span className="text-[11px] text-muted-foreground">
                {s!.email ?? "conta Google"}
                {s!.connectedAt && ` · desde ${formatDay(s!.connectedAt)}`}
              </span>
            </span>
            {!confirming && (
              <Button variant="outline" size="lg" className="ml-auto" onClick={() => setConfirming(true)}>
                Desconectar
              </Button>
            )}
          </div>
          {confirming && (
            <div role="alertdialog" aria-labelledby="disc-title" className="flex flex-col gap-2.5 border-b bg-red-500/5 px-4 py-3">
              <p id="disc-title" className="font-semibold">
                Desconectar o Google Agenda?
              </p>
              <p className="text-muted-foreground">O acesso é revogado no Google. Seus eventos continuam lá.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="lg" onClick={() => setConfirming(false)} autoFocus>
                  Cancelar
                </Button>
                <Button size="lg" disabled={busy} onClick={disconnect} className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-400 dark:text-neutral-950">
                  Desconectar
                </Button>
              </div>
            </div>
          )}
          <fieldset className="flex flex-col gap-0.5 border-0 px-4 py-3.5">
            <legend className={LEGEND}>Mostrar no app</legend>
            {s!.calendars.map((c) => (
              <div key={c.id} className="flex min-h-10 items-center gap-2.5">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={(e) => save({ visible: e.target.checked ? [...visibleIds, c.id] : visibleIds.filter((id) => id !== c.id) })}
                    className="size-[18px] shrink-0 accent-foreground"
                  />
                  <span className="size-2.5 shrink-0" style={{ background: c.color }} aria-hidden="true" />
                  <span className="truncate">{c.name}</span>
                  {!c.writable && <span className="text-[11px] text-muted-foreground">só leitura</span>}
                </label>
                {c.writable &&
                  (s!.defaultId === c.id ? (
                    <span className="text-[11px] text-muted-foreground">padrão para novos eventos</span>
                  ) : (
                    <button type="button" onClick={() => save({ defaultId: c.id })} className="min-h-10 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      tornar padrão
                    </button>
                  ))}
              </div>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1 border-t px-4 py-3.5">
            <label className="flex min-h-10 cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={s!.showTasks} onChange={(e) => save({ showTasks: e.target.checked })} className="size-[18px] accent-foreground" />
              Mostrar tarefas com data na agenda
            </label>
            <p className="ml-7 text-[11px] text-muted-foreground">Ficam tracejadas e não vão para o Google.</p>
          </div>
        </section>
      )}
    </div>
  );
}
