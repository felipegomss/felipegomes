import type { Metadata } from "next";
import { getAgendaSettings, type AgendaSettings } from "@/lib/calendar/service";
import { googleConfigured } from "@/lib/google/oauth";
import { CalendarsManager } from "./calendars-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agendas" };

const ERRORS: Record<string, string> = {
  config: "Falta configurar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no servidor.",
  state: "A conexão expirou ou veio de outra aba. Tente de novo.",
  negado: "A permissão foi negada no Google.",
  codigo: "O Google não devolveu o código de autorização.",
  token: "O Google recusou a troca do código. Confira o Client ID/Secret e a URI de redirecionamento.",
};

export default async function CalendarsPage({ searchParams }: { searchParams: Promise<{ erro?: string; conectado?: string }> }) {
  const sp = await searchParams;
  let settings: AgendaSettings | null = null;
  let loadError: string | null = null;
  try {
    settings = await getAgendaSettings();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Falha ao falar com o Google Agenda.";
  }
  return (
    <CalendarsManager
      settings={settings}
      configured={googleConfigured()}
      error={loadError ?? (sp.erro ? (ERRORS[sp.erro] ?? "Não foi possível conectar.") : null)}
      justConnected={sp.conectado === "1"}
    />
  );
}
