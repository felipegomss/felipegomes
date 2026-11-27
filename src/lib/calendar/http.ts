import { NextResponse } from "next/server";
import { GoogleAuthError } from "@/lib/google/oauth";
import { CalendarError } from "./service";

/** Erro da agenda → resposta JSON com status adequado. */
export function calendarErrorResponse(e: unknown) {
  if (e instanceof CalendarError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof GoogleAuthError) return NextResponse.json({ error: e.message, reconnect: true }, { status: 409 });
  console.error("[calendar]", e);
  return NextResponse.json({ error: "Falha ao falar com o Google Agenda." }, { status: 502 });
}
