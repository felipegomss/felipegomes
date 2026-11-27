CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"list" text DEFAULT 'Pessoal' NOT NULL,
	"due_date" date,
	"due_time" text,
	"repeat" text DEFAULT 'none' NOT NULL,
	"repeat_days" integer[],
	"via" text,
	"spawned_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tasks_open_due_idx" ON "tasks" USING btree ("completed_at","due_date");