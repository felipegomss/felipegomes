import { NextResponse } from "next/server";
import { authenticationOptions } from "@/lib/passkeys";

export async function POST(request: Request) {
  return NextResponse.json(await authenticationOptions(request));
}
