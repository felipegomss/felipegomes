CREATE TABLE "job_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"company" text,
	"location" text,
	"author_name" text,
	"author_url" text,
	"posted_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"matched_keywords" text[],
	"contact_emails" text[],
	"contact_whatsapps" text[],
	"raw" jsonb,
	CONSTRAINT "job_posts_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE INDEX "job_posts_status_posted_at_idx" ON "job_posts" USING btree ("status","posted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "job_posts_scraped_at_idx" ON "job_posts" USING btree ("scraped_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "job_posts_source_idx" ON "job_posts" USING btree ("source");