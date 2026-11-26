CREATE TABLE "pet_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"species" text,
	"morph" text,
	"sex" text,
	"hatch_date" date,
	"acquired_date" date,
	"feed_interval_days" integer DEFAULT 10 NOT NULL,
	"water_interval_days" integer DEFAULT 15 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "pet_logs" ADD CONSTRAINT "pet_logs_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pet_logs_pet_occurred_idx" ON "pet_logs" USING btree ("pet_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "pet_logs_pet_type_occurred_idx" ON "pet_logs" USING btree ("pet_id","type","occurred_at" DESC NULLS LAST);--> statement-breakpoint
-- Primeiro pet. Novos bichos entram por migration (sem tela de cadastro).
INSERT INTO "pets" ("slug", "name", "species", "morph", "sex", "hatch_date", "acquired_date", "feed_interval_days", "water_interval_days", "notes")
VALUES ('jorgin', 'Jorgin', 'Lampropeltis (kingsnake)', 'Striped', 'male', '2024-03-06', '2025-02-17', 10, 15, 'Terrário bioativo.')
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
-- Histórico importado do app antigo reptile-keeper (MongoDB). As datas não
-- tinham hora: ficam ao meio-dia de Brasília e marcadas com importedFrom.
INSERT INTO "pet_logs" ("pet_id", "type", "occurred_at", "data")
SELECT p."id", v."type", v."occurred_at"::timestamptz, v."data"
FROM "pets" p, (VALUES
  ('weight', '2025-02-03 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 55}'::jsonb),
  ('weight', '2025-02-21 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 51}'::jsonb),
  ('feeding', '2025-02-24 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 6}'::jsonb),
  ('weight', '2025-02-26 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 50}'::jsonb),
  ('feeding', '2025-03-06 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 7}'::jsonb),
  ('weight', '2025-03-10 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 57}'::jsonb),
  ('feeding', '2025-03-18 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 4}'::jsonb),
  ('feeding', '2025-03-20 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 4}'::jsonb),
  ('feeding', '2025-03-25 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 6}'::jsonb),
  ('weight', '2025-03-28 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 57}'::jsonb),
  ('feeding', '2025-03-30 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 18}'::jsonb),
  ('feeding', '2025-12-12 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 20}'::jsonb),
  ('feeding', '2026-02-01 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 24}'::jsonb),
  ('shed', '2026-02-02 12:00:00-03', '{"importedFrom": "reptile-keeper", "complete": true}'::jsonb),
  ('feeding', '2026-02-16 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 22}'::jsonb),
  ('weight', '2026-02-24 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 225}'::jsonb),
  ('feeding', '2026-02-26 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 28}'::jsonb),
  ('feeding', '2026-03-03 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 26}'::jsonb),
  ('feeding', '2026-03-09 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 23}'::jsonb),
  ('feeding', '2026-03-16 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "refused", "prey": "camundongo", "preyWeightG": 23}'::jsonb),
  ('feeding', '2026-03-18 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "refused", "prey": "camundongo", "preyWeightG": 27}'::jsonb),
  ('feeding', '2026-03-21 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 27}'::jsonb),
  ('shed', '2026-03-22 12:00:00-03', '{"importedFrom": "reptile-keeper", "complete": true}'::jsonb),
  ('feeding', '2026-03-29 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 24}'::jsonb),
  ('feeding', '2026-04-16 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 25}'::jsonb),
  ('shed', '2026-04-16 12:00:00-03', '{"importedFrom": "reptile-keeper", "complete": true}'::jsonb),
  ('feeding', '2026-05-21 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 29}'::jsonb),
  ('weight', '2026-06-08 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 254}'::jsonb),
  ('feeding', '2026-06-09 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 30}'::jsonb),
  ('shed', '2026-06-10 12:00:00-03', '{"importedFrom": "reptile-keeper", "complete": false}'::jsonb),
  ('feeding', '2026-06-29 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "camundongo", "preyWeightG": 44}'::jsonb),
  ('shed', '2026-07-19 12:00:00-03', '{"importedFrom": "reptile-keeper", "complete": true}'::jsonb),
  ('weight', '2026-07-28 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 266}'::jsonb),
  ('weight', '2026-08-15 12:00:00-03', '{"importedFrom": "reptile-keeper", "grams": 260}'::jsonb),
  ('feeding', '2026-09-05 12:00:00-03', '{"importedFrom": "reptile-keeper", "result": "accepted", "prey": "rato", "preyWeightG": 30}'::jsonb)
) AS v("type", "occurred_at", "data")
WHERE p."slug" = 'jorgin'
  AND NOT EXISTS (SELECT 1 FROM "pet_logs" l WHERE l."pet_id" = p."id");
