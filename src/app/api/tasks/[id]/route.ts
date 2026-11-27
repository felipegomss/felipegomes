import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteTask, setTaskDone, updateTask } from "@/lib/tasks/service";

type Ctx = { params: Promise<{ id: string }> };

/** `{ done: boolean }` conclui/desfaz; os demais campos editam. */
export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  if (typeof body.done === "boolean") {
    const result = await setTaskDone(id, body.done);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.value);
  }
  const result = await updateTask(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ task: result.value });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const result = await deleteTask(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result.value);
}
