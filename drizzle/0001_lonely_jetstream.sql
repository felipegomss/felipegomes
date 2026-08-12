CREATE TABLE "site_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"value" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Baseline: 703 visualizações acumuladas no Umami até a virada do contador.
INSERT INTO "site_counters" ("key", "value") VALUES ('page_views', 703) ON CONFLICT ("key") DO NOTHING;
