import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createPetLog } from "@/lib/pets/actions";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  const result = await createPetLog({ slug, type: String(body.type ?? ""), occurredAt: body.occurredAt, data: body.data, notes: body.notes });
  if (!result.ok) return NextResponse.json({ error: result.error, fields: result.fields }, { status: result.status });
  return NextResponse.json({ log: result.value }, { status: 201 });
}
