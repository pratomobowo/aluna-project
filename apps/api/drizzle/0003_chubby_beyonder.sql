ALTER TABLE "transactions" ADD COLUMN "therapist_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "therapist_net" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
