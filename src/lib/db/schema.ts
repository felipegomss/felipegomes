import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export const JOB_SOURCES = [
  "linkedin-jobs",
  "linkedin-posts",
  "github-frontendbr",
  "github-backendbr",
  "github-react-brasil",
  "remoteok",
  "hn-hiring",
] as const;
export type JobSource = (typeof JOB_SOURCES)[number];
