import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const jobPosts = pgTable(
  "job_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull().unique(),
    source: text("source").notNull(),
    type: text("type").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    company: text("company"),
    location: text("location"),
    authorName: text("author_name"),
    authorUrl: text("author_url"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    status: text("status").notNull().default("new"),
    starred: boolean("starred").notNull().default(false),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    matchedKeywords: text("matched_keywords").array(),
    contactEmails: text("contact_emails").array(),
    contactWhatsapps: text("contact_whatsapps").array(),
    raw: jsonb("raw"),
  },
  (table) => [
    index("job_posts_status_posted_at_idx").on(table.status, table.postedAt.desc()),
    index("job_posts_scraped_at_idx").on(table.scrapedAt.desc()),
    index("job_posts_source_idx").on(table.source),
  ],
);

export type JobPost = typeof jobPosts.$inferSelect;
export type NewJobPost = typeof jobPosts.$inferInsert;

export const JOB_STATUSES = ["new", "contacted", "dismissed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["post", "job"] as const;
export type JobType = (typeof JOB_TYPES)[number];

// Contadores agregados do site. Uma linha por métrica, incrementada de forma
// atômica — o detalhamento (páginas, origem, país) fica no Umami.
export const siteCounters = pgTable("site_counters", {
  key: text("key").primaryKey(),
  value: bigint("value", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const PAGE_VIEWS_COUNTER = "page_views";

export const JOB_SOURCES = [
  "github-frontendbr",
  "github-backendbr",
  "github-react-brasil",
  "remoteok",
  "hn-hiring",
  "vagas-com-br",
  "coodesh",
] as const;
export type JobSource = (typeof JOB_SOURCES)[number];

// ── Pets ─────────────────────────────────────────────────────────────────────
// Um perfil por animal (identificado por slug) e um log genérico de eventos de
// manejo. Novos animais entram por migration (sem tela de cadastro). O payload específico de cada tipo vai em `data` (jsonb) — ver
// `src/lib/pets/types.ts` para o formato de cada um.
export const pets = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  species: text("species"),
  morph: text("morph"),
  sex: text("sex"),
  hatchDate: date("hatch_date"),
  acquiredDate: date("acquired_date"),
  feedIntervalDays: integer("feed_interval_days").notNull().default(10),
  waterIntervalDays: integer("water_interval_days").notNull().default(15),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type Pet = typeof pets.$inferSelect;
export type NewPet = typeof pets.$inferInsert;

export const petLogs = pgTable(
  "pet_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    data: jsonb("data").notNull().default(sql`'{}'::jsonb`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index("pet_logs_pet_occurred_idx").on(table.petId, table.occurredAt.desc()),
    index("pet_logs_pet_type_occurred_idx").on(
      table.petId,
      table.type,
      table.occurredAt.desc(),
    ),
  ],
);

export type PetLog = typeof petLogs.$inferSelect;
export type NewPetLog = typeof petLogs.$inferInsert;

// ── Passkeys do admin (WebAuthn) ────────────────────────────────────────────
// Uma linha por credencial (Touch ID do Mac, Face ID do iPhone…). Com o
// Chaveiro do iCloud, a mesma passkey costuma aparecer em todos os aparelhos.
export const adminPasskeys = pgTable("admin_passkeys", {
  /** ID da credencial em base64url. */
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: text("transports").array(),
  deviceType: text("device_type"),
  backedUp: boolean("backed_up").notNull().default(false),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export type AdminPasskey = typeof adminPasskeys.$inferSelect;

// ── OAuth para agentes (MCP) ────────────────────────────────────────────────
// Clientes se registram sozinhos (Dynamic Client Registration). Cada
// autorização aprovada vira um grant; tokens são assinados e só valem enquanto
// o grant não for revogado.
export const oauthClients = pgTable("oauth_clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  redirectUris: text("redirect_uris").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const oauthGrants = pgTable("oauth_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: text("client_id")
    .notNull()
    .references(() => oauthClients.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type OAuthClient = typeof oauthClients.$inferSelect;
export type OAuthGrant = typeof oauthGrants.$inferSelect;

// Tarefas pessoais. `dueDate` é um dia do calendário (sem fuso); `dueTime`
// opcional "HH:MM". Repetição: ao concluir, a próxima ocorrência vira outra
// linha e `spawnedId` aponta para ela (para desfazer a conclusão).
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    notes: text("notes"),
    list: text("list").notNull().default("Pessoal"),
    dueDate: date("due_date", { mode: "string" }),
    dueTime: text("due_time"),
    repeat: text("repeat").notNull().default("none"),
    repeatDays: integer("repeat_days").array(),
    via: text("via"),
    spawnedId: uuid("spawned_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (table) => [index("tasks_open_due_idx").on(table.completedAt, table.dueDate)],
);

export type TaskRow = typeof tasks.$inferSelect;
