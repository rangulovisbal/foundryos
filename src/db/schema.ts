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
    preferredLanguage: varchar("preferred_language", { length: 8 }),
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
    positioningStatement: text("positioning_statement"),
    channelUrls: jsonb("channel_urls").$type<string[]>(),
    industry: varchar("industry", { length: 120 }),
    businessModel: varchar("business_model", { length: 120 }),
    teamSize: varchar("team_size", { length: 64 }),
    geography: varchar("geography", { length: 160 }),
    primaryOffer: text("primary_offer"),
    targetAudience: text("target_audience"),
    conversionAction: text("conversion_action"),
    pricingModel: text("pricing_model"),
    acquisitionMethod: text("acquisition_method"),
    salesProcess: text("sales_process"),
    currentChannels: jsonb("current_channels").$type<string[]>(),
    currentTools: jsonb("current_tools").$type<string[]>(),
    primaryGoals: jsonb("primary_goals").$type<string[]>(),
    biggestBottlenecks: jsonb("biggest_bottlenecks").$type<string[]>(),
    evidenceNotes: text("evidence_notes"),
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
      Array<{
        key: string;
        label: string;
        score: number;
        rationale: string;
        basedOn: string[];
        drivers?: Array<{
          label: string;
          points: number;
          tone: "positive" | "negative";
          basedOn: string[];
        }>;
      }>
    >().notNull(),
    topBottlenecks: jsonb("top_bottlenecks").$type<
      Array<{
        title: string;
        detail: string;
        severity: string;
        basedOn?: string[];
      }>
    >().notNull(),
    topRisks: jsonb("top_risks").$type<
      Array<{
        title: string;
        detail: string;
        severity: string;
        basedOn?: string[];
      }>
    >().notNull(),
    topOpportunities: jsonb("top_opportunities").$type<
      Array<{
        title: string;
        detail: string;
        impact: string;
        basedOn?: string[];
      }>
    >().notNull(),
    confidence: varchar("confidence", { length: 32 }).notNull(),
    recommendedNextActions: jsonb("recommended_next_actions").$type<
      Array<{
        title: string;
        detail: string;
        owner: string;
        timeframe: string;
        basedOn?: string[];
      }>
    >().notNull(),
    evidenceCards: jsonb("evidence_cards").$type<
      Array<{
        title: string;
        observation: string;
        implication: string;
        basedOn?: string[];
        signalQuality?: "strong" | "mixed" | "weak";
      }>
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

export const planningJobs = pgTable(
  "planning_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id")
      .notNull()
      .references(() => diagnosticResults.id, { onDelete: "cascade" }),
    jobType: varchar("job_type", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("planning_jobs_workspace_idx").on(table.workspaceId),
    index("planning_jobs_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("planning_jobs_type_idx").on(table.jobType),
    index("planning_jobs_status_idx").on(table.status),
    index("planning_jobs_created_idx").on(table.createdAt)
  ]
);

export const roadmaps = pgTable(
  "roadmaps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => planningJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id")
      .notNull()
      .references(() => diagnosticResults.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    items: jsonb("items").$type<
      Array<{
        title: string;
        description: string;
        phase: string;
        categoryTags: string[];
        effortLevel: string;
        expectedImpact: string;
        dependencies: string[];
        reasoning: string;
      }>
    >().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("roadmaps_job_idx").on(table.jobId),
    index("roadmaps_workspace_idx").on(table.workspaceId),
    index("roadmaps_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("roadmaps_created_idx").on(table.createdAt)
  ]
);

export const actionPlans = pgTable(
  "action_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => planningJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id")
      .notNull()
      .references(() => diagnosticResults.id, { onDelete: "cascade" }),
    sourceRoadmapId: uuid("source_roadmap_id").references(() => roadmaps.id, {
      onDelete: "set null"
    }),
    actions: jsonb("actions").$type<
      Array<{
        title: string;
        description: string;
        priority: string;
        ownerSuggestion: string;
        status: string;
        linkedCategory: string;
        linkedReasoning: string;
      }>
    >().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("action_plans_job_idx").on(table.jobId),
    index("action_plans_workspace_idx").on(table.workspaceId),
    index("action_plans_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("action_plans_roadmap_idx").on(table.sourceRoadmapId),
    index("action_plans_created_idx").on(table.createdAt)
  ]
);

export const thirtyDayPlans = pgTable(
  "thirty_day_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => planningJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id")
      .notNull()
      .references(() => diagnosticResults.id, { onDelete: "cascade" }),
    monthObjective: text("month_objective").notNull(),
    topPriorities: jsonb("top_priorities").$type<string[]>().notNull(),
    week1: jsonb("week_1").$type<{
      title: string;
      objective: string;
      actions: string[];
      successSignal: string;
    }>().notNull(),
    week2: jsonb("week_2").$type<{
      title: string;
      objective: string;
      actions: string[];
      successSignal: string;
    }>().notNull(),
    week3: jsonb("week_3").$type<{
      title: string;
      objective: string;
      actions: string[];
      successSignal: string;
    }>().notNull(),
    week4: jsonb("week_4").$type<{
      title: string;
      objective: string;
      actions: string[];
      successSignal: string;
    }>().notNull(),
    quickWins: jsonb("quick_wins").$type<string[]>().notNull(),
    risksToAvoid: jsonb("risks_to_avoid").$type<string[]>().notNull(),
    successSignals: jsonb("success_signals").$type<string[]>().notNull(),
    metricsToWatch: jsonb("metrics_to_watch").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("thirty_day_plans_job_idx").on(table.jobId),
    index("thirty_day_plans_workspace_idx").on(table.workspaceId),
    index("thirty_day_plans_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("thirty_day_plans_created_idx").on(table.createdAt)
  ]
);

export const assetJobs = pgTable(
  "asset_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    sourceBusinessProfileId: uuid("source_business_profile_id").references(
      () => workspaceBusinessProfiles.id,
      { onDelete: "set null" }
    ),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id").references(
      () => diagnosticResults.id,
      { onDelete: "set null" }
    ),
    sourceRoadmapId: uuid("source_roadmap_id").references(() => roadmaps.id, {
      onDelete: "set null"
    }),
    sourceActionPlanId: uuid("source_action_plan_id").references(() => actionPlans.id, {
      onDelete: "set null"
    }),
    sourceThirtyDayPlanId: uuid("source_thirty_day_plan_id").references(
      () => thirtyDayPlans.id,
      { onDelete: "set null" }
    ),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("asset_jobs_workspace_idx").on(table.workspaceId),
    index("asset_jobs_status_idx").on(table.status),
    index("asset_jobs_created_idx").on(table.createdAt),
    index("asset_jobs_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("asset_jobs_roadmap_idx").on(table.sourceRoadmapId),
    index("asset_jobs_thirty_day_plan_idx").on(table.sourceThirtyDayPlanId)
  ]
);

export const businessAssets = pgTable(
  "business_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => assetJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    assetType: varchar("asset_type", { length: 64 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    purpose: text("purpose").notNull(),
    content: jsonb("content").$type<
      Array<{
        heading: string;
        items: string[];
      }>
    >().notNull(),
    sourceReferences: jsonb("source_references").$type<
      Array<{
        sourceType: string;
        label: string;
        referenceId?: string;
        detail: string;
      }>
    >().notNull(),
    generationStatus: varchar("generation_status", { length: 32 })
      .notNull()
      .default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("business_assets_job_idx").on(table.jobId),
    index("business_assets_workspace_idx").on(table.workspaceId),
    index("business_assets_type_idx").on(table.assetType),
    index("business_assets_status_idx").on(table.generationStatus),
    index("business_assets_created_idx").on(table.createdAt)
  ]
);

export const sopJobs = pgTable(
  "sop_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    sourceBusinessProfileId: uuid("source_business_profile_id").references(
      () => workspaceBusinessProfiles.id,
      { onDelete: "set null" }
    ),
    sourceDiagnosticResultId: uuid("source_diagnostic_result_id").references(
      () => diagnosticResults.id,
      { onDelete: "set null" }
    ),
    sourceRoadmapId: uuid("source_roadmap_id").references(() => roadmaps.id, {
      onDelete: "set null"
    }),
    sourceThirtyDayPlanId: uuid("source_thirty_day_plan_id").references(
      () => thirtyDayPlans.id,
      { onDelete: "set null" }
    ),
    sourceAssetJobId: uuid("source_asset_job_id").references(() => assetJobs.id, {
      onDelete: "set null"
    }),
    inputHash: varchar("input_hash", { length: 64 }),
    status: varchar("status", { length: 32 }).notNull().default("queued"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("sop_jobs_workspace_idx").on(table.workspaceId),
    index("sop_jobs_status_idx").on(table.status),
    index("sop_jobs_created_idx").on(table.createdAt),
    index("sop_jobs_diagnostic_idx").on(table.sourceDiagnosticResultId),
    index("sop_jobs_input_hash_idx").on(table.workspaceId, table.inputHash)
  ]
);

export const sopArtifacts = pgTable(
  "sop_artifacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => sopJobs.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sopType: varchar("sop_type", { length: 64 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    purpose: text("purpose").notNull(),
    content: jsonb("content").$type<
      Array<{
        heading: string;
        items: string[];
      }>
    >().notNull(),
    sourceReferences: jsonb("source_references").$type<
      Array<{
        sourceType: string;
        label: string;
        referenceId?: string;
        detail: string;
      }>
    >().notNull(),
    generationStatus: varchar("generation_status", { length: 32 })
      .notNull()
      .default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("sop_artifacts_job_idx").on(table.jobId),
    index("sop_artifacts_workspace_idx").on(table.workspaceId),
    index("sop_artifacts_type_idx").on(table.sopType),
    index("sop_artifacts_created_idx").on(table.createdAt)
  ]
);

export const supportRequests = pgTable(
  "support_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    issueType: varchar("issue_type", { length: 64 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 32 }).notNull().default("submitted"),
    adminNotes: text("admin_notes"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("support_requests_workspace_idx").on(table.workspaceId),
    index("support_requests_requested_by_idx").on(table.requestedByUserId),
    index("support_requests_status_idx").on(table.status),
    index("support_requests_created_idx").on(table.createdAt)
  ]
);

export const deletionRequests = pgTable(
  "deletion_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    requestType: varchar("request_type", { length: 64 }).notNull(),
    reason: text("reason"),
    status: varchar("status", { length: 32 }).notNull().default("submitted"),
    adminNotes: text("admin_notes"),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("deletion_requests_workspace_idx").on(table.workspaceId),
    index("deletion_requests_requested_by_idx").on(table.requestedByUserId),
    index("deletion_requests_type_idx").on(table.requestType),
    index("deletion_requests_status_idx").on(table.status),
    index("deletion_requests_created_idx").on(table.createdAt)
  ]
);

export const outputFeedback = pgTable(
  "output_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    moduleType: varchar("module_type", { length: 32 }).notNull(),
    outputId: uuid("output_id"),
    label: varchar("label", { length: 16 }).notNull(),
    note: text("note"),
    submittedByUserId: uuid("submitted_by_user_id").references(() => appUsers.id, {
      onDelete: "set null"
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>()
  },
  (table) => [
    index("output_feedback_workspace_idx").on(table.workspaceId),
    index("output_feedback_module_idx").on(table.workspaceId, table.moduleType),
    index("output_feedback_submitted_idx").on(table.submittedAt)
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
