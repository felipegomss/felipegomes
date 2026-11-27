import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { calendarErrorResponse } from "@/lib/calendar/http";
import { getAgendaSettings, updateAgendaSettings } from "@/lib/calendar/service";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getAgendaSettings());
  } catch (e) {
    return calendarErrorResponse(e);
  }
}

/** `{ visible?: string[], defaultId?: string, showTasks?: boolean }` */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  try {
    await updateAgendaSettings(body);
    return NextResponse.json(await getAgendaSettings());
  } catch (e) {
    return calendarErrorResponse(e);
  }
}
