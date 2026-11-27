import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { disconnectGoogle } from "@/lib/google/oauth";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
