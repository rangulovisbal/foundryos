import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

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

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    globalRole: varchar("global_role", { length: 32 }).notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex("app_users_email_idx").on(table.email)]
);

export const appSessions = pgTable(
  "app_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("app_sessions_token_idx").on(table.tokenHash),
    index("app_sessions_user_idx").on(table.userId),
    index("app_sessions_expires_idx").on(table.expiresAt)
  ]
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 32 }).notNull().default("growth-os"),
    accountState: varchar("account_state", { length: 32 }).notNull().default("trial"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("workspaces_slug_idx").on(table.slug),
    index("workspaces_owner_idx").on(table.ownerUserId)
  ]
);

export const workspaceMemberships = pgTable(
  "workspace_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("workspace_memberships_unique_idx").on(table.workspaceId, table.userId),
    index("workspace_memberships_user_idx").on(table.userId)
  ]
);

export const workspaceInvitations = pgTable(
  "workspace_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("workspace_invitations_token_idx").on(table.tokenHash),
    index("workspace_invitations_workspace_idx").on(table.workspaceId),
    index("workspace_invitations_email_idx").on(table.email)
  ]
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("email_verification_tokens_token_idx").on(table.tokenHash),
    index("email_verification_tokens_user_idx").on(table.userId)
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("password_reset_tokens_token_idx").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId)
  ]
);

export const workspaceUsageCounters = pgTable(
  "workspace_usage_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metricKey: varchar("metric_key", { length: 64 }).notNull(),
    limitCount: integer("limit_count").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("workspace_usage_counters_unique_idx").on(
      table.workspaceId,
      table.metricKey
    ),
    index("workspace_usage_counters_workspace_idx").on(table.workspaceId)
  ]
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 64 }).notNull(),
    previousPlan: varchar("previous_plan", { length: 32 }),
    nextPlan: varchar("next_plan", { length: 32 }),
    previousAccountState: varchar("previous_account_state", { length: 32 }),
    nextAccountState: varchar("next_account_state", { length: 32 }),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("admin_audit_logs_workspace_idx").on(table.workspaceId),
    index("admin_audit_logs_admin_idx").on(table.adminUserId),
    index("admin_audit_logs_created_idx").on(table.createdAt)
  ]
);
