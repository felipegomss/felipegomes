import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { verifyRegistration } from "@/lib/passkeys";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.response) return NextResponse.json({ error: "Body inválido." }, { status: 400 });

  try {
    const result = await verifyRegistration(request, body.response, String(body.name ?? ""));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
