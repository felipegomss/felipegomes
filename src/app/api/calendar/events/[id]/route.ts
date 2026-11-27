import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { calendarErrorResponse } from "@/lib/calendar/http";
import { deleteEvent, updateEvent } from "@/lib/calendar/service";

type Ctx = { params: Promise<{ id: string }> };

const calendarOf = (request: Request) => new URL(request.url).searchParams.get("calendarId") ?? "";

/** `?calendarId=…` identifica a agenda do evento. */
export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  try {
    return NextResponse.json({ event: await updateEvent(calendarOf(request), id, body) });
  } catch (e) {
    return calendarErrorResponse(e);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteEvent(calendarOf(request), id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return calendarErrorResponse(e);
  }
}
