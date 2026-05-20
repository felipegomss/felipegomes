import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Resend } from "resend";

export async function GET(request: Request) {
  const session = (await cookies()).get("admin_session");
  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY não configurada." },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
  const after = url.searchParams.get("after") ?? undefined;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.list(
    after ? { limit, after } : { limit },
  );

  if (error) {
    return NextResponse.json({ error: error.message ?? "Resend error" }, { status: 502 });
  }

  return NextResponse.json({
    data: data?.data ?? [],
    hasMore: data?.has_more ?? false,
  });
}
