import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { updateJob } from "@/lib/jobs/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: unknown; starred?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  const result = await updateJob(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ data: result.value });
}
