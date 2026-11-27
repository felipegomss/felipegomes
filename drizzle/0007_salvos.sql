CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"platform" text NOT NULL,
	"title" text,
	"author" text,
	"thumbnail_url" text,
	"content" text,
	"summary" text,
	"category" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_links_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE INDEX "saved_links_created_idx" ON "saved_links" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "saved_links_category_idx" ON "saved_links" USING btree ("category");