import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db, jobPosts, JOB_STATUSES, type JobStatus } from "@/lib/db/client";

type PatchBody = {
  status?: string;
  starred?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await cookies()).get("admin_session");
  if (!session || session.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const updates: {
    status?: JobStatus;
    starred?: boolean;
  } = {};
  let stampContactedAt = false;

  if (typeof body.status === "string") {
    if (!(JOB_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }
    updates.status = body.status as JobStatus;
    if (body.status === "contacted") {
      stampContactedAt = true;
    }
  }

  if (typeof body.starred === "boolean") {
    updates.starred = body.starred;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada a atualizar." }, { status: 400 });
  }

  // Preserve the first-contact timestamp across status toggles by
  // only stamping when previously null. Use NOW() so the driver
  // doesn't have to bind a JS Date inside a sql template.
  const setClause = stampContactedAt
    ? {
        ...updates,
        contactedAt: sql`COALESCE(${jobPosts.contactedAt}, NOW())`,
      }
    : updates;

  const updated = await db
    .update(jobPosts)
    .set(setClause)
    .where(eq(jobPosts.id, id))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ data: updated[0] });
}
