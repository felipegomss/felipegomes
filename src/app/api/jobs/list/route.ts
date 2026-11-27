import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listJobs } from "@/lib/jobs/service";

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = new URL(request.url).searchParams;
  return NextResponse.json(
    await listJobs({
      status: p.get("status"),
      source: p.get("source"),
      starredOnly: p.get("starred") === "1",
      q: p.get("q"),
      limit: Number(p.get("limit") ?? 50),
      offset: Number(p.get("offset") ?? 0),
    }),
  );
}
