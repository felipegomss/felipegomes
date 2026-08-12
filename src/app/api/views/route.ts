import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, siteCounters, PAGE_VIEWS_COUNTER } from "@/lib/db/client";

// Incremento do contador de visualizações. Sempre 204: um contador nunca deve
// virar erro visível no cliente.
export async function POST() {
  try {
    await db
      .insert(siteCounters)
      .values({ key: PAGE_VIEWS_COUNTER, value: 1 })
      .onConflictDoUpdate({
        target: siteCounters.key,
        set: { value: sql`${siteCounters.value} + 1`, updatedAt: sql`now()` },
      });
  } catch {
    // silencioso de propósito
  }

  return new NextResponse(null, { status: 204 });
}
