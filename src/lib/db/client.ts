import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida.");
}

// Neon pooled connection: prepare must be disabled (PgBouncer transaction mode).
const queryClient = postgres(connectionString, { prepare: false });

export const db = drizzle(queryClient, { schema });

export * from "./schema";
