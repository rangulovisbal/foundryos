import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    company: varchar("company", { length: 160 }).notNull(),
    website: varchar("website", { length: 255 }),
    teamSize: varchar("team_size", { length: 32 }).notNull(),
    message: text("message").notNull(),
    source: varchar("source", { length: 64 }).notNull().default("website"),
    status: varchar("status", { length: 32 }).notNull().default("new"),
    consent: boolean("consent").notNull().default(true),
    snapshotRequested: boolean("snapshot_requested").notNull().default(true),
    score: integer("score"),
    utmSource: varchar("utm_source", { length: 120 }),
    utmMedium: varchar("utm_medium", { length: 120 }),
    utmCampaign: varchar("utm_campaign", { length: 120 }),
    turnstileVerified: boolean("turnstile_verified").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index("leads_email_idx").on(table.email)]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }),
    company: varchar("company", { length: 160 }),
    planId: varchar("plan_id", { length: 64 }),
    status: varchar("status", { length: 64 }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index("subscriptions_customer_idx").on(table.stripeCustomerId)]
);
