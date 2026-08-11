CREATE TABLE IF NOT EXISTS "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"mode" text NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"category" text NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"member_count" integer DEFAULT 0 NOT NULL,
	"schedule" text,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reward_id" integer NOT NULL,
	"points_spent" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tag" text NOT NULL,
	"points" integer NOT NULL,
	"icon" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "points_transactions_userId_idx" ON "points_transactions" USING btree ("user_id");