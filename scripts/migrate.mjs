// Aplica as migrations do Drizzle no build de produção da Vercel.
//
// - Só roda com VERCEL_ENV=production (o preview usa o mesmo banco; migrar no
//   preview alteraria produção antes do merge). Para forçar: MIGRATE_ON_BUILD=1.
// - Se o banco foi criado com `drizzle-kit push` (sem a tabela de controle do
//   Drizzle), marca como aplicadas as migrations cujas tabelas já existem antes
//   de rodar as novas — senão o migrator tentaria recriar tudo.
// - Qualquer erro derruba o build: o deploy anterior continua no ar.
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const MIGRATIONS = "./drizzle";
const SCHEMA = "drizzle";
const TABLE = "__drizzle_migrations";

const shouldRun = process.env.VERCEL_ENV === "production" || process.env.MIGRATE_ON_BUILD === "1";
if (!shouldRun) {
  console.log(`[migrate] pulado (VERCEL_ENV=${process.env.VERCEL_ENV ?? "local"}).`);
  process.exit(0);
}

const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.vagas_DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  process.env.vagas_DATABASE_URL;

if (!url) {
  console.error("[migrate] nenhuma URL de banco encontrada (DATABASE_URL / vagas_DATABASE_URL).");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

/** Primeira tabela criada por uma migration — usada para saber se ela já está no banco. */
function createdTable(statements) {
  for (const s of statements) {
    const m = s.match(/CREATE TABLE (?:IF NOT EXISTS )?"?(?:public"?\."?)?([a-z0-9_]+)"?/i);
    if (m) return m[1];
  }
  return null;
}

async function tableExists(name) {
  const [row] = await client`select to_regclass(${`public.${name}`}) is not null as exists`;
  return row.exists;
}

async function baselineIfNeeded() {
  await client`create schema if not exists ${client(SCHEMA)}`;
  await client`
    create table if not exists ${client(SCHEMA)}.${client(TABLE)} (
      id serial primary key,
      hash text not null,
      created_at bigint
    )`;
  const [{ count }] = await client`select count(*)::int as count from ${client(SCHEMA)}.${client(TABLE)}`;
  if (count > 0) return;

  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS });
  const applied = [];
  for (const m of migrations) {
    const table = createdTable(m.sql);
    if (!table || !(await tableExists(table))) break;
    await client`insert into ${client(SCHEMA)}.${client(TABLE)} (hash, created_at) values (${m.hash}, ${m.folderMillis})`;
    applied.push(table);
  }
  if (applied.length) {
    console.log(`[migrate] banco sem histórico do Drizzle; marcadas como aplicadas: ${applied.join(", ")}.`);
  }
}

try {
  await baselineIfNeeded();
  await migrate(drizzle(client), { migrationsFolder: MIGRATIONS, migrationsSchema: SCHEMA, migrationsTable: TABLE });
  console.log("[migrate] migrations em dia.");
} catch (err) {
  console.error("[migrate] falhou:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
