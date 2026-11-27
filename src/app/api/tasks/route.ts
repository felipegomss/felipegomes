import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createTask, listDoneTasks, listOpenTasks } from "@/lib/tasks/service";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [open, done] = await Promise.all([listOpenTasks(), listDoneTasks()]);
  return NextResponse.json({ open, done });
}

/** `{ text }` (adicionar rápido) ou campos: title, notes, list, dueDate, dueTime, repeat, repeatDays. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  const result = await createTask(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ task: result.value }, { status: 201 });
}
