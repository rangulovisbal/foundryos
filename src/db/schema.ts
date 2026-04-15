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
    outputLanguage: varchar("output_language", { length: 8 }).notNull().default("en"),
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

export const workspaceBusinessProfiles = pgTable(
  "workspace_business_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 160 }),
    website: varchar("website", { length: 255 }),
    industry: varchar("industry", { length: 120 }),
    businessModel: varchar("business_model", { length: 120 }),
    teamSize: varchar("team_size", { length: 64 }),
    geography: varchar("geography", { length: 160 }),
    primaryOffer: text("primary_offer"),
    targetAudience: text("target_audience"),
    currentChannels: jsonb("current_channels").$type<string[]>(),
    currentTools: jsonb("current_tools").$type<string[]>(),
    primaryGoals: jsonb("primary_goals").$type<string[]>(),
    biggestBottlenecks: jsonb("biggest_bottlenecks").$type<string[]>(),
    budgetBand: varchar("budget_band", { length: 64 }),
    lifecycleStage: varchar("lifecycle_stage", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("workspace_business_profiles_workspace_idx").on(table.workspaceId),
    index("workspace_business_profiles_updated_idx").on(table.updatedAt)
  ]
);

export const diagnosticJobs = pgTable(
  "diagnostic_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    jobType: varchar("job_type", { length: 64 })
      .notNull()
      .default("business_profile_diagnostic"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("diagnostic_jobs_workspace_idx").on(table.workspaceId),
    index("diagnostic_jobs_status_idx").on(table.status),
    index("diagnostic_jobs_created_idx").on(table.createdAt)
  ]
);

export const diagnosticResults = pgTable(
  "diagnostic_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => diagnosticJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    overallMaturityScore: integer("overall_maturity_score").notNull(),
    categoryScores: jsonb("category_scores").$type<
      Array<{ key: string; label: string; score: number; rationale: string }>
    >().notNull(),
    topBottlenecks: jsonb("top_bottlenecks").$type<
      Array<{ title: string; detail: string; severity: string }>
    >().notNull(),
    topRisks: jsonb("top_risks").$type<
      Array<{ title: string; detail: string; severity: string }>
    >().notNull(),
    topOpportunities: jsonb("top_opportunities").$type<
      Array<{ title: string; detail: string; impact: string }>
    >().notNull(),
    confidence: varchar("confidence", { length: 32 }).notNull(),
    recommendedNextActions: jsonb("recommended_next_actions").$type<
      Array<{ title: string; detail: string; owner: string; timeframe: string }>
    >().notNull(),
    evidenceCards: jsonb("evidence_cards").$type<
      Array<{ title: string; observation: string; implication: string }>
    >().notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("diagnostic_results_job_idx").on(table.jobId),
    index("diagnostic_results_workspace_idx").on(table.workspaceId),
    index("diagnostic_results_created_idx").on(table.createdAt)
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
