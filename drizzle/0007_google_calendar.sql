CREATE TABLE "google_accounts" (
	"id" text PRIMARY KEY DEFAULT 'me' NOT NULL,
	"email" text,
	"refresh_token" text NOT NULL,
	"access_token" text,
	"access_expires_at" timestamp with time zone,
	"scope" text,
	"calendars" jsonb,
	"show_tasks" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
