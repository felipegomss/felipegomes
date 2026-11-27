import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { registrationOptions } from "@/lib/passkeys";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await registrationOptions(request));
}
