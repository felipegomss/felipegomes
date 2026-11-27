import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { calendarErrorResponse } from "@/lib/calendar/http";
import { createEvent, listAgenda } from "@/lib/calendar/service";
import { addDays, isDayKey, todayKey } from "@/lib/tasks/model";

/** `?from=AAAA-MM-DD&to=AAAA-MM-DD` (padrão: próximos 7 dias). */
export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const today = todayKey();
  const from = url.searchParams.get("from") ?? today;
  const to = url.searchParams.get("to") ?? addDays(from, 6);
  if (!isDayKey(from) || !isDayKey(to) || to < from) return NextResponse.json({ error: "Intervalo inválido." }, { status: 400 });
  try {
    const { items } = await listAgenda(from, to);
    return NextResponse.json({ items });
  } catch (e) {
    return calendarErrorResponse(e);
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  try {
    return NextResponse.json({ event: await createEvent(body) }, { status: 201 });
  } catch (e) {
    return calendarErrorResponse(e);
  }
}
