import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { sendOutreach } from "@/lib/email/outreach";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  try {
    const result = await sendOutreach({
      to: Array.isArray(body.to) ? body.to : [body.to].filter(Boolean),
      subject: body.subject,
      body: body.body,
      locale: body.locale,
      attachCv: !!body.attachCv,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ id: result.id });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
