CREATE TYPE "public"."budget_kind" AS ENUM('fuel', 'ev', 'rental', 'public', 'accommodation', 'food', 'custom');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'electric');--> statement-breakpoint
CREATE TYPE "public"."history_action" AS ENUM('create', 'update', 'delete', 'restore');--> statement-breakpoint
CREATE TYPE "public"."invite_kind" AS ENUM('trip', 'friend', 'guest_claim', 'guest_statement');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'co_admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."notify_level" AS ENUM('instant', 'digest', 'off');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('marked_paid', 'confirmed', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."settle_mode" AS ENUM('minimal', 'per_expense');--> statement-breakpoint
CREATE TYPE "public"."split_mode" AS ENUM('equal', 'percentage', 'exact', 'shares');--> statement-breakpoint
CREATE TYPE "public"."trip_stage" AS ENUM('planning', 'active', 'settling', 'closed', 'cancelled');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"category" text NOT NULL,
	"kind" "budget_kind" NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"amount_minor" bigint NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_items_amount_non_negative" CHECK ("budget_items"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "expense_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" "history_action" NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_shares" (
	"expense_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"share_minor" bigint NOT NULL,
	CONSTRAINT "expense_shares_expense_id_member_id_pk" PRIMARY KEY("expense_id","member_id"),
	CONSTRAINT "expense_shares_non_negative" CHECK ("expense_shares"."share_minor" >= 0)
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"payer_member_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"fx_rate" numeric(18, 8) DEFAULT '1' NOT NULL,
	"base_amount_minor" bigint NOT NULL,
	"split_mode" "split_mode" DEFAULT 'equal' NOT NULL,
	"split_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"spent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"receipt_file_id" text,
	CONSTRAINT "expenses_amount_positive" CHECK ("expenses"."amount_minor" > 0),
	CONSTRAINT "expenses_base_amount_positive" CHECK ("expenses"."base_amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"user_id" uuid NOT NULL,
	"friend_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "friendships_user_id_friend_id_pk" PRIMARY KEY("user_id","friend_id"),
	CONSTRAINT "friendships_not_self" CHECK ("friendships"."user_id" <> "friendships"."friend_id")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid,
	"user_id" uuid,
	"member_id" uuid,
	"token" text NOT NULL,
	"kind" "invite_kind" NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	CONSTRAINT "invites_token_unique" UNIQUE("token"),
	CONSTRAINT "invites_target" CHECK (("invites"."kind" = 'friend' and "invites"."user_id" is not null) or ("invites"."kind" <> 'friend' and "invites"."trip_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trip_id" uuid,
	"level" "notify_level" DEFAULT 'instant' NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "notification_prefs_user_trip_key" UNIQUE NULLS NOT DISTINCT("user_id","trip_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"trip_id" uuid,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"from_member_id" uuid NOT NULL,
	"to_member_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"method" text,
	"note" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "payment_status" DEFAULT 'marked_paid' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount_minor" > 0),
	CONSTRAINT "payments_not_self" CHECK ("payments"."from_member_id" <> "payments"."to_member_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"from_member_id" uuid NOT NULL,
	"to_member_id" uuid NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_name" text,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "trip_members_user_or_guest" CHECK (("trip_members"."user_id" is not null) or ("trip_members"."guest_name" is not null))
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"destinations" text[] DEFAULT '{}'::text[] NOT NULL,
	"start_date" date,
	"end_date" date,
	"days" smallint,
	"base_currency" text DEFAULT 'LKR' NOT NULL,
	"stage" "trip_stage" DEFAULT 'planning' NOT NULL,
	"settle_mode" "settle_mode" DEFAULT 'minimal' NOT NULL,
	"cover_url" text,
	"drive_folder_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_dates_order" CHECK ("trips"."end_date" is null or "trips"."start_date" is null or "trips"."end_date" >= "trips"."start_date"),
	CONSTRAINT "trips_days_positive" CHECK ("trips"."days" is null or "trips"."days" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"avatar_url" text,
	"username" text,
	"country" text DEFAULT 'LK' NOT NULL,
	"default_currency" text DEFAULT 'LKR' NOT NULL,
	"time_zone" text DEFAULT 'Asia/Colombo' NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_format" CHECK ("users"."username" ~ '^[a-z0-9_]{3,20}$'),
	CONSTRAINT "users_currency_format" CHECK ("users"."default_currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "users_country_format" CHECK ("users"."country" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"fuel_type" "fuel_type" NOT NULL,
	"efficiency" numeric(6, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_member_id_trip_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payer_member_id_trip_members_id_fk" FOREIGN KEY ("payer_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_member_id_trip_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."trip_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_from_member_id_trip_members_id_fk" FOREIGN KEY ("from_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_to_member_id_trip_members_id_fk" FOREIGN KEY ("to_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_from_member_id_trip_members_id_fk" FOREIGN KEY ("from_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_to_member_id_trip_members_id_fk" FOREIGN KEY ("to_member_id") REFERENCES "public"."trip_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "budget_items_trip_id_idx" ON "budget_items" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "expense_history_expense_id_idx" ON "expense_history" USING btree ("expense_id","at");--> statement-breakpoint
CREATE INDEX "expense_shares_member_id_idx" ON "expense_shares" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "expenses_trip_id_spent_at_idx" ON "expenses" USING btree ("trip_id","spent_at");--> statement-breakpoint
CREATE INDEX "expenses_payer_member_id_idx" ON "expenses" USING btree ("payer_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_key" ON "friendships" USING btree (least("user_id", "friend_id"),greatest("user_id", "friend_id"));--> statement-breakpoint
CREATE INDEX "friendships_friend_id_idx" ON "friendships" USING btree ("friend_id");--> statement-breakpoint
CREATE INDEX "invites_trip_id_idx" ON "invites" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "invites_user_id_idx" ON "invites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_trip_id_idx" ON "payments" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_pair_idx" ON "reminders" USING btree ("from_member_id","to_member_id","sent_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trip_members_trip_id_idx" ON "trip_members" USING btree ("trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_members_trip_user_key" ON "trip_members" USING btree ("trip_id","user_id") WHERE "trip_members"."user_id" is not null;--> statement-breakpoint
CREATE INDEX "trip_members_user_id_idx" ON "trip_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_owner_id_idx" ON "trips" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower_key" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "vehicles_user_id_idx" ON "vehicles" USING btree ("user_id");