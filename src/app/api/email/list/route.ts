import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listSentEmails } from "@/lib/email/outreach";

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
  const result = await listSentEmails(limit, url.searchParams.get("after") ?? undefined);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error.includes("RESEND_API_KEY") ? 500 : 502 });
  return NextResponse.json({ data: result.data, hasMore: result.hasMore });
}
