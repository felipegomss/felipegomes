-- starred e contacted_at foram criadas em produção via `drizzle-kit push` e
-- nunca entraram numa migration. IF NOT EXISTS: não faz nada em produção e
-- deixa bancos novos (criados só pelas migrations) iguais ao schema.
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "starred" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "contacted_at" timestamp with time zone;
