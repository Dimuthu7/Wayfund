/**
 * Wayfund database schema (Drizzle ORM).
 *
 * Conventions
 * - Money is always integer minor units (`bigint` columns) plus an ISO 4217 code. Never floats.
 * - Balances are calculated (see the `member_balances` view in the migrations), never stored.
 * - Row-level security, roles, helper functions and views live in hand-written SQL
 *   migrations under `drizzle/` because Drizzle can't express all of them.
 * - Property names are camelCase; columns are snake_case (`casing: "snake_case"`).
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
// bigint in Postgres, read as a JS number: safe up to 9e15 minor units, and JSON-friendly for sync.
const money = () => bigint({ mode: "number" });

/* ------------------------------------------------------------------ enums */

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "declined",
]);
export const tripStageEnum = pgEnum("trip_stage", [
  "planning",
  "active",
  "settling",
  "closed",
  "cancelled",
]);
export const settleModeEnum = pgEnum("settle_mode", ["minimal", "per_expense"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "co_admin", "member"]);
export const inviteKindEnum = pgEnum("invite_kind", [
  "trip",
  "friend",
  "guest_claim",
  "guest_statement",
]);
export const budgetKindEnum = pgEnum("budget_kind", [
  "fuel",
  "ev",
  "rental",
  "public",
  "accommodation",
  "food",
  "custom",
]);
export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "electric"]);
export const splitModeEnum = pgEnum("split_mode", ["equal", "percentage", "exact", "shares"]);
export const historyActionEnum = pgEnum("history_action", [
  "create",
  "update",
  "delete",
  "restore",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["marked_paid", "confirmed", "disputed"]);
export const notifyLevelEnum = pgEnum("notify_level", ["instant", "digest", "off"]);

/* ----------------------------------------------------- users and Auth.js */

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Display name. Called `name` so the Auth.js adapter can fill it from the provider. */
    name: text("display_name"),
    email: text(),
    emailVerified: timestamp({ withTimezone: true, mode: "date" }),
    /** Avatar URL. Called `image` for the Auth.js adapter. */
    image: text("avatar_url"),
    username: text(),
    country: text().notNull().default("LK"),
    defaultCurrency: text().notNull().default("LKR"),
    timeZone: text().notNull().default("Asia/Colombo"),
    plan: planEnum().notNull().default("free"),
    isSuperAdmin: boolean().notNull().default(false),
    onboardedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_username_lower_key").on(sql`lower(${t.username})`),
    uniqueIndex("users_email_lower_key").on(sql`lower(${t.email})`),
    check("users_username_format", sql`${t.username} ~ '^[a-z0-9_]{3,20}$'`),
    check("users_currency_format", sql`${t.defaultCurrency} ~ '^[A-Z]{3}$'`),
    check("users_country_format", sql`${t.country} ~ '^[A-Z]{2}$'`),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text().$type<"oauth" | "oidc" | "email" | "webauthn">().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("accounts_user_id_idx").on(t.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ---------------------------------------------------------------- friends */

/**
 * One row per friend request. `userId` sent it to `friendId`.
 * A unique index on the unordered pair stops duplicate or crossed requests.
 */
export const friendships = pgTable(
  "friendships",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    friendId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum().notNull().default("pending"),
    createdAt: createdAt(),
    respondedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.friendId] }),
    uniqueIndex("friendships_pair_key").on(
      sql`least(${t.userId}, ${t.friendId})`,
      sql`greatest(${t.userId}, ${t.friendId})`,
    ),
    index("friendships_friend_id_idx").on(t.friendId),
    check("friendships_not_self", sql`${t.userId} <> ${t.friendId}`),
  ],
);

/* ------------------------------------------------------------------ trips */

export const trips = pgTable(
  "trips",
  {
    id: uuid().primaryKey().defaultRandom(),
    ownerId: uuid()
      .notNull()
      .references(() => users.id),
    name: text().notNull(),
    description: text(),
    destinations: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    startDate: date(),
    endDate: date(),
    days: smallint(),
    baseCurrency: text().notNull().default("LKR"),
    stage: tripStageEnum().notNull().default("planning"),
    settleMode: settleModeEnum().notNull().default("minimal"),
    coverUrl: text(),
    driveFolderId: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("trips_owner_id_idx").on(t.ownerId),
    check(
      "trips_dates_order",
      sql`${t.endDate} is null or ${t.startDate} is null or ${t.endDate} >= ${t.startDate}`,
    ),
    check("trips_days_positive", sql`${t.days} is null or ${t.days} > 0`),
  ],
);

export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    /** Null for a guest who hasn't signed up. */
    userId: uuid().references(() => users.id, { onDelete: "set null" }),
    guestName: text(),
    role: memberRoleEnum().notNull().default("member"),
    joinedAt: createdAt(),
    leftAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("trip_members_trip_id_idx").on(t.tripId),
    uniqueIndex("trip_members_trip_user_key")
      .on(t.tripId, t.userId)
      .where(sql`${t.userId} is not null`),
    index("trip_members_user_id_idx").on(t.userId),
    check(
      "trip_members_user_or_guest",
      sql`(${t.userId} is not null) or (${t.guestName} is not null)`,
    ),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid().references(() => trips.id, { onDelete: "cascade" }),
    userId: uuid().references(() => users.id, { onDelete: "cascade" }),
    /** For guest claim and statement links, the guest member it points to. */
    memberId: uuid().references(() => tripMembers.id, { onDelete: "cascade" }),
    /** 128-bit random token, base64url. */
    token: text().notNull().unique(),
    kind: inviteKindEnum().notNull(),
    createdBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    revokedAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("invites_trip_id_idx").on(t.tripId),
    index("invites_user_id_idx").on(t.userId),
    check(
      "invites_target",
      sql`(${t.kind} = 'friend' and ${t.userId} is not null) or (${t.kind} <> 'friend' and ${t.tripId} is not null)`,
    ),
  ],
);

/* ----------------------------------------------------------------- budget */

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text().notNull(),
    fuelType: fuelTypeEnum().notNull(),
    /** km per litre, or km per kWh for electric. */
    efficiency: numeric({ precision: 6, scale: 2 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("vehicles_user_id_idx").on(t.userId)],
);

export const budgetItems = pgTable(
  "budget_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    category: text().notNull(),
    kind: budgetKindEnum().notNull(),
    inputs: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    amountMinor: money().notNull(),
    sortOrder: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("budget_items_trip_id_idx").on(t.tripId),
    check("budget_items_amount_non_negative", sql`${t.amountMinor} >= 0`),
  ],
);

/* --------------------------------------------------------------- expenses */

export const expenses = pgTable(
  "expenses",
  {
    /** UUID made on the device, so offline retries upsert instead of duplicating. */
    id: uuid().primaryKey(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    payerMemberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    description: text().notNull(),
    category: text().notNull().default("other"),
    amountMinor: money().notNull(),
    currency: text().notNull(),
    /** Rate to the trip's base currency, as a decimal string. 1 when the same currency. */
    fxRate: numeric({ precision: 18, scale: 8 }).notNull().default("1"),
    baseAmountMinor: money().notNull(),
    splitMode: splitModeEnum().notNull().default("equal"),
    splitInputs: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    spentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid()
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: timestamp({ withTimezone: true }),
    receiptFileId: text(),
  },
  (t) => [
    index("expenses_trip_id_spent_at_idx").on(t.tripId, t.spentAt),
    index("expenses_payer_member_id_idx").on(t.payerMemberId),
    check("expenses_amount_positive", sql`${t.amountMinor} > 0`),
    check("expenses_base_amount_positive", sql`${t.baseAmountMinor} > 0`),
  ],
);

export const expenseShares = pgTable(
  "expense_shares",
  {
    expenseId: uuid()
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    memberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    /** Share in the trip's base currency. */
    shareMinor: money().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.expenseId, t.memberId] }),
    index("expense_shares_member_id_idx").on(t.memberId),
    check("expense_shares_non_negative", sql`${t.shareMinor} >= 0`),
  ],
);

export const expenseHistory = pgTable(
  "expense_history",
  {
    id: uuid().primaryKey().defaultRandom(),
    expenseId: uuid()
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: historyActionEnum().notNull(),
    before: jsonb(),
    after: jsonb(),
    at: createdAt(),
  },
  (t) => [index("expense_history_expense_id_idx").on(t.expenseId, t.at)],
);

/* --------------------------------------------------------------- payments */

export const payments = pgTable(
  "payments",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    fromMemberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    toMemberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    amountMinor: money().notNull(),
    method: text(),
    note: text(),
    paidAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    status: paymentStatusEnum().notNull().default("marked_paid"),
    confirmedAt: timestamp({ withTimezone: true }),
    createdBy: uuid()
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    index("payments_trip_id_idx").on(t.tripId),
    check("payments_amount_positive", sql`${t.amountMinor} > 0`),
    check("payments_not_self", sql`${t.fromMemberId} <> ${t.toMemberId}`),
  ],
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid().primaryKey().defaultRandom(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    fromMemberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    toMemberId: uuid()
      .notNull()
      .references(() => tripMembers.id),
    sentAt: createdAt(),
  },
  (t) => [index("reminders_pair_idx").on(t.fromMemberId, t.toMemberId, t.sentAt)],
);

/* ---------------------------------------------------------- notifications */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tripId: uuid().references(() => trips.id, { onDelete: "cascade" }),
    type: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_id_created_at_idx").on(t.userId, t.createdAt)],
);

export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Null means the user's default for all trips. */
    tripId: uuid().references(() => trips.id, { onDelete: "cascade" }),
    level: notifyLevelEnum().notNull().default("instant"),
    pushEnabled: boolean().notNull().default(true),
    emailEnabled: boolean().notNull().default(true),
  },
  (t) => [unique("notification_prefs_user_trip_key").on(t.userId, t.tripId).nullsNotDistinct()],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text().notNull().unique(),
    keys: jsonb().$type<{ p256dh: string; auth: string }>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("push_subscriptions_user_id_idx").on(t.userId)],
);
