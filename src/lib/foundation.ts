import { z } from "zod";

export const workspacePlanOptions = [
  "snapshot",
  "growth-os",
  "operator"
] as const;

export const workspaceAccountStateOptions = [
  "lead",
  "trial",
  "active",
  "past_due",
  "canceled",
  "suspended",
  "archived"
] as const;

export const workspaceRoleOptions = [
  "owner",
  "admin",
  "member",
  "viewer"
] as const;

export const userGlobalRoleOptions = ["user", "internal_admin"] as const;

export const usageMetricKeyOptions = [
  "seats",
  "diagnostic_runs",
  "asset_exports",
  "monthly_refreshes"
] as const;

export const diagnosticJobStatusOptions = [
  "queued",
  "processing",
  "completed",
  "failed"
] as const;

export const planningJobStatusOptions = diagnosticJobStatusOptions;

export const planningJobTypeOptions = [
  "roadmap_generation",
  "thirty_day_plan_generation"
] as const;

export const assetJobStatusOptions = diagnosticJobStatusOptions;

export const sopJobStatusOptions = diagnosticJobStatusOptions;

export const sopArtifactTypeOptions = [
  "lead_handling",
  "reporting_cadence",
  "campaign_setup",
  "content_workflow",
  "internal_approval"
] as const;

export const businessAssetTypeOptions = [
  "positioning_summary",
  "thirty_day_action_plan_summary",
  "messaging_framework",
  "basic_channel_plan",
  "execution_checklist",
  "founder_summary"
] as const;

export const outputLanguageOptions = ["en", "es"] as const;
export const supportIssueTypeOptions = [
  "product_question",
  "account_access",
  "diagnostics",
  "planning",
  "assets",
  "sops",
  "billing_state",
  "bug_report",
  "workspace_admin",
  "other"
] as const;
export const supportRequestStatusOptions = [
  "submitted",
  "triaged",
  "in_progress",
  "resolved",
  "closed"
] as const;
export const deletionRequestTypeOptions = [
  "account_deletion",
  "workspace_deletion"
] as const;
export const deletionRequestStatusOptions = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "completed"
] as const;

export const roadmapPhaseOptions = ["now", "next", "later"] as const;
export const effortLevelOptions = ["low", "medium", "high"] as const;
export const impactLevelOptions = ["low", "medium", "high"] as const;
export const actionPriorityOptions = ["high", "medium", "low"] as const;
export const actionStatusOptions = ["not_started", "in_progress", "blocked", "done"] as const;

export type WorkspacePlan = (typeof workspacePlanOptions)[number];
export type WorkspaceAccountState = (typeof workspaceAccountStateOptions)[number];
export type WorkspaceRole = (typeof workspaceRoleOptions)[number];
export type UserGlobalRole = (typeof userGlobalRoleOptions)[number];
export type UsageMetricKey = (typeof usageMetricKeyOptions)[number];
export type DiagnosticJobStatus = (typeof diagnosticJobStatusOptions)[number];
export type PlanningJobStatus = (typeof planningJobStatusOptions)[number];
export type PlanningJobType = (typeof planningJobTypeOptions)[number];
export type AssetJobStatus = (typeof assetJobStatusOptions)[number];
export type SopJobStatus = (typeof sopJobStatusOptions)[number];
export type SopArtifactType = (typeof sopArtifactTypeOptions)[number];
export type BusinessAssetType = (typeof businessAssetTypeOptions)[number];
export type OutputLanguage = (typeof outputLanguageOptions)[number];
export type SupportIssueType = (typeof supportIssueTypeOptions)[number];
export type SupportRequestStatus = (typeof supportRequestStatusOptions)[number];
export type DeletionRequestType = (typeof deletionRequestTypeOptions)[number];
export type DeletionRequestStatus = (typeof deletionRequestStatusOptions)[number];
export type RoadmapPhase = (typeof roadmapPhaseOptions)[number];
export type EffortLevel = (typeof effortLevelOptions)[number];
export type ImpactLevel = (typeof impactLevelOptions)[number];
export type ActionPriority = (typeof actionPriorityOptions)[number];
export type ActionStatus = (typeof actionStatusOptions)[number];

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
  globalRole: UserGlobalRole;
  createdAt: string;
  updatedAt: string;
};

export type AppSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  plan: WorkspacePlan;
  accountState: WorkspaceAccountState;
  outputLanguage: OutputLanguage;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMembershipRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceInvitationRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  tokenHash: string;
  invitedByUserId: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type PasswordResetRecord = {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type UsageCounterRecord = {
  id: string;
  workspaceId: string;
  metricKey: UsageMetricKey;
  limitCount: number;
  usedCount: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
};

export type BusinessProfileRecord = {
  id: string;
  workspaceId: string;
  companyName: string | null;
  website: string | null;
  industry: string | null;
  businessModel: string | null;
  teamSize: string | null;
  geography: string | null;
  primaryOffer: string | null;
  targetAudience: string | null;
  currentChannels: string[];
  currentTools: string[];
  primaryGoals: string[];
  biggestBottlenecks: string[];
  budgetBand: string | null;
  lifecycleStage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiagnosticCategoryScore = {
  key: string;
  label: string;
  score: number;
  rationale: string;
};

export type DiagnosticFinding = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type DiagnosticOpportunity = {
  title: string;
  detail: string;
  impact: "low" | "medium" | "high";
};

export type DiagnosticNextAction = {
  title: string;
  detail: string;
  owner: string;
  timeframe: string;
};

export type DiagnosticEvidenceCard = {
  title: string;
  observation: string;
  implication: string;
};

export type DiagnosticJobRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string | null;
  status: DiagnosticJobStatus;
  jobType: string;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiagnosticResultRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  overallMaturityScore: number;
  categoryScores: DiagnosticCategoryScore[];
  topBottlenecks: DiagnosticFinding[];
  topRisks: DiagnosticFinding[];
  topOpportunities: DiagnosticOpportunity[];
  confidence: "low" | "medium" | "high";
  recommendedNextActions: DiagnosticNextAction[];
  evidenceCards: DiagnosticEvidenceCard[];
  summary: string;
  createdAt: string;
};

export type DiagnosticJobWithResult = {
  job: DiagnosticJobRecord;
  result: DiagnosticResultRecord | null;
};

export type PlanningJobRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string | null;
  sourceDiagnosticResultId: string;
  jobType: PlanningJobType;
  status: PlanningJobStatus;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapItem = {
  title: string;
  description: string;
  phase: RoadmapPhase;
  categoryTags: string[];
  effortLevel: EffortLevel;
  expectedImpact: ImpactLevel;
  dependencies: string[];
  reasoning: string;
};

export type RoadmapRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  sourceDiagnosticResultId: string;
  summary: string;
  items: RoadmapItem[];
  createdAt: string;
};

export type PlanActionItem = {
  title: string;
  description: string;
  priority: ActionPriority;
  ownerSuggestion: string;
  status: ActionStatus;
  linkedCategory: string;
  linkedReasoning: string;
};

export type ActionPlanRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  sourceDiagnosticResultId: string;
  sourceRoadmapId: string | null;
  actions: PlanActionItem[];
  createdAt: string;
};

export type ThirtyDayPlanWeek = {
  title: string;
  objective: string;
  actions: string[];
  successSignal: string;
};

export type ThirtyDayPlanRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  sourceDiagnosticResultId: string;
  monthObjective: string;
  topPriorities: string[];
  week1: ThirtyDayPlanWeek;
  week2: ThirtyDayPlanWeek;
  week3: ThirtyDayPlanWeek;
  week4: ThirtyDayPlanWeek;
  quickWins: string[];
  risksToAvoid: string[];
  successSignals: string[];
  metricsToWatch: string[];
  createdAt: string;
};

export type PlanningJobWithArtifacts = {
  job: PlanningJobRecord;
  roadmap: RoadmapRecord | null;
  actionPlan: ActionPlanRecord | null;
  thirtyDayPlan: ThirtyDayPlanRecord | null;
};

export type AssetJobRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string | null;
  sourceBusinessProfileId: string | null;
  sourceDiagnosticResultId: string | null;
  sourceRoadmapId: string | null;
  sourceActionPlanId: string | null;
  sourceThirtyDayPlanId: string | null;
  status: AssetJobStatus;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessAssetSection = {
  heading: string;
  items: string[];
};

export type BusinessAssetSourceReference = {
  sourceType:
    | "workspace"
    | "business_profile"
    | "diagnostic"
    | "roadmap"
    | "action_plan"
    | "thirty_day_plan";
  label: string;
  referenceId?: string;
  detail: string;
};

export type BusinessAssetRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  assetType: BusinessAssetType;
  title: string;
  purpose: string;
  content: BusinessAssetSection[];
  sourceReferences: BusinessAssetSourceReference[];
  generationStatus: AssetJobStatus;
  createdAt: string;
  updatedAt: string;
};

export type AssetJobWithAssets = {
  job: AssetJobRecord;
  assets: BusinessAssetRecord[];
};

export type SopJobRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string | null;
  sourceBusinessProfileId: string | null;
  sourceDiagnosticResultId: string | null;
  sourceRoadmapId: string | null;
  sourceThirtyDayPlanId: string | null;
  sourceAssetJobId: string | null;
  inputHash: string | null;
  status: SopJobStatus;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SopArtifactSection = {
  heading: string;
  items: string[];
};

export type SopArtifactSourceReference = {
  sourceType:
    | "workspace"
    | "business_profile"
    | "diagnostic"
    | "roadmap"
    | "thirty_day_plan";
  label: string;
  referenceId?: string;
  detail: string;
};

export type SopArtifactRecord = {
  id: string;
  jobId: string;
  workspaceId: string;
  sopType: SopArtifactType;
  title: string;
  purpose: string;
  content: SopArtifactSection[];
  sourceReferences: SopArtifactSourceReference[];
  generationStatus: SopJobStatus;
  createdAt: string;
  updatedAt: string;
};

export type SopJobWithArtifacts = {
  job: SopJobRecord;
  artifacts: SopArtifactRecord[];
};

export type SupportRequestRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string;
  issueType: SupportIssueType;
  message: string;
  status: SupportRequestStatus;
  adminNotes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportRequestWithRequester = {
  request: SupportRequestRecord;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName">;
  reviewedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
};

export type DeletionRequestRecord = {
  id: string;
  workspaceId: string;
  requestedByUserId: string;
  requestType: DeletionRequestType;
  reason: string | null;
  status: DeletionRequestStatus;
  adminNotes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeletionRequestWithRequester = {
  request: DeletionRequestRecord;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName">;
  reviewedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
};

export type AdminAuditLogRecord = {
  id: string;
  adminUserId: string;
  workspaceId: string;
  action: string;
  previousPlan: WorkspacePlan | null;
  nextPlan: WorkspacePlan | null;
  previousAccountState: WorkspaceAccountState | null;
  nextAccountState: WorkspaceAccountState | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type WorkspaceMembershipView = {
  membership: WorkspaceMembershipRecord;
  workspace: WorkspaceRecord;
};

export type WorkspaceContext = {
  user: AppUser;
  workspace: WorkspaceRecord;
  membership: WorkspaceMembershipRecord;
  usage: UsageCounterRecord[];
};

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Enter a valid email."),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .regex(/[A-Z]/, "Add at least one uppercase letter.")
    .regex(/[a-z]/, "Add at least one lowercase letter.")
    .regex(/[0-9]/, "Add at least one number.")
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email.")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Reset token is invalid."),
  password: signupSchema.shape.password
});

export const workspaceCreationSchema = z.object({
  name: z.string().min(2, "Workspace name is required."),
  plan: z.enum(workspacePlanOptions).default("growth-os")
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email."),
  role: z.enum(["admin", "member", "viewer"])
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(16, "Invitation token is invalid.")
});

export const adminBootstrapSchema = z.object({
  token: z.string().trim().min(1, "Admin token is required.")
});

export const workspaceAdminUpdateSchema = z.object({
  accountState: z.enum(workspaceAccountStateOptions),
  plan: z.enum(workspacePlanOptions)
});

const optionalProfileText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .default("");

const profileListSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(12)
  .optional()
  .default([]);

export const businessProfileSchema = z.object({
  outputLanguage: z.enum(outputLanguageOptions).default("en"),
  companyName: optionalProfileText(160),
  website: optionalProfileText(255).refine(
    (value) => !value || /^https?:\/\/[^.\s]+\.[^\s]+$/i.test(value),
    "Use a full website URL starting with http:// or https://."
  ),
  industry: optionalProfileText(120),
  businessModel: optionalProfileText(120),
  teamSize: optionalProfileText(64),
  geography: optionalProfileText(160),
  primaryOffer: optionalProfileText(1200),
  targetAudience: optionalProfileText(1200),
  currentChannels: profileListSchema,
  currentTools: profileListSchema,
  primaryGoals: profileListSchema,
  biggestBottlenecks: profileListSchema,
  budgetBand: optionalProfileText(64),
  lifecycleStage: optionalProfileText(64)
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const supportRequestSchema = z.object({
  issueType: z.enum(supportIssueTypeOptions),
  message: z
    .string()
    .trim()
    .min(20, "Add enough detail for support to understand the issue.")
    .max(2000, "Keep the support message under 2000 characters.")
});

export const deletionRequestSchema = z.object({
  requestType: z.enum(deletionRequestTypeOptions),
  reason: z
    .string()
    .trim()
    .max(1200, "Keep the request reason under 1200 characters.")
    .optional()
    .default(""),
  confirmationText: z.string().trim().min(1, "Confirmation text is required.")
});

export const supportRequestAdminUpdateSchema = z.object({
  status: z.enum(supportRequestStatusOptions),
  adminNotes: z
    .string()
    .trim()
    .max(1200, "Keep the admin notes under 1200 characters.")
    .optional()
    .default("")
});

export const deletionRequestAdminUpdateSchema = z.object({
  status: z.enum(deletionRequestStatusOptions),
  adminNotes: z
    .string()
    .trim()
    .max(1200, "Keep the admin notes under 1200 characters.")
    .optional()
    .default("")
});

export type SupportRequestInput = z.infer<typeof supportRequestSchema>;
export type DeletionRequestInput = z.infer<typeof deletionRequestSchema>;

type PlanDefinition = {
  label: string;
  description: string;
  features: Record<
    | "dashboard"
    | "profile"
    | "diagnostics"
    | "roadmap"
    | "actions"
    | "thirty_day_plan"
    | "assets"
    | "sops"
    | "team"
    | "billing"
    | "monthly_refresh"
    | "automations"
    | "integrations"
    | "priority_support",
    boolean
  >;
  usageLimits: Record<UsageMetricKey, number>;
};

export const planDefinitions: Record<WorkspacePlan, PlanDefinition> = {
  snapshot: {
    label: "AI Snapshot",
    description: "Paid diagnostic and 30-day operating plan.",
    features: {
      dashboard: true,
      profile: true,
      diagnostics: true,
      roadmap: true,
      actions: true,
      thirty_day_plan: true,
      assets: true,
      sops: false,
      team: false,
      billing: true,
      monthly_refresh: false,
      automations: false,
      integrations: false,
      priority_support: false
    },
    usageLimits: {
      seats: 1,
      diagnostic_runs: 1,
      asset_exports: 3,
      monthly_refreshes: 0
    }
  },
  "growth-os": {
    label: "FoundryOS Core",
    description: "Recurring operating layer for lean teams.",
    features: {
      dashboard: true,
      profile: true,
      diagnostics: true,
      roadmap: true,
      actions: true,
      thirty_day_plan: true,
      assets: true,
      sops: true,
      team: true,
      billing: true,
      monthly_refresh: true,
      automations: true,
      integrations: false,
      priority_support: false
    },
    usageLimits: {
      seats: 5,
      diagnostic_runs: 6,
      asset_exports: 20,
      monthly_refreshes: 1
    }
  },
  operator: {
    label: "Operator",
    description: "Premium implementation and integration support.",
    features: {
      dashboard: true,
      profile: true,
      diagnostics: true,
      roadmap: true,
      actions: true,
      thirty_day_plan: true,
      assets: true,
      sops: true,
      team: true,
      billing: true,
      monthly_refresh: true,
      automations: true,
      integrations: true,
      priority_support: true
    },
    usageLimits: {
      seats: 15,
      diagnostic_runs: 20,
      asset_exports: 100,
      monthly_refreshes: 4
    }
  }
};

export function slugifyWorkspaceName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function getPlanDefinition(plan: WorkspacePlan) {
  return planDefinitions[plan];
}

export function seedUsageCounters(workspaceId: string, plan: WorkspacePlan) {
  const limits = getPlanDefinition(plan).usageLimits;
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  return Object.entries(limits).map(([metricKey, limitCount]) => ({
    id: crypto.randomUUID(),
    workspaceId,
    metricKey: metricKey as UsageMetricKey,
    limitCount,
    usedCount: metricKey === "seats" ? 1 : 0,
    periodStart,
    periodEnd,
    updatedAt: now.toISOString()
  }));
}

export function isLockedState(accountState: WorkspaceAccountState) {
  return ["canceled", "suspended", "archived"].includes(accountState);
}

export function isReadOnlyState(accountState: WorkspaceAccountState) {
  return isLockedState(accountState) || accountState === "past_due";
}

export function canAccessWorkspace(accountState: WorkspaceAccountState) {
  return accountState !== "lead";
}

export function canManageWorkspace(
  role: WorkspaceRole,
  accountState: WorkspaceAccountState
) {
  return ["owner", "admin"].includes(role) && !isReadOnlyState(accountState);
}

export function canEditBusinessProfile(
  role: WorkspaceRole,
  accountState: WorkspaceAccountState
) {
  return canManageWorkspace(role, accountState);
}

export function getUsageCounter(
  context: Pick<WorkspaceContext, "usage">,
  metricKey: UsageMetricKey
) {
  return context.usage.find((counter) => counter.metricKey === metricKey) ?? null;
}

export function hasUsageRemaining(
  context: Pick<WorkspaceContext, "usage">,
  metricKey: UsageMetricKey
) {
  const counter = getUsageCounter(context, metricKey);
  if (!counter) {
    return false;
  }

  return counter.usedCount < counter.limitCount;
}

export function canRunDiagnostics(context: WorkspaceContext) {
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    plan.features.diagnostics &&
    canAccessWorkspace(context.workspace.accountState) &&
    canManageWorkspace(context.membership.role, context.workspace.accountState) &&
    hasUsageRemaining(context, "diagnostic_runs")
  );
}

export function canGenerateRoadmap(context: WorkspaceContext) {
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    plan.features.roadmap &&
    canAccessWorkspace(context.workspace.accountState) &&
    canManageWorkspace(context.membership.role, context.workspace.accountState)
  );
}

export function canGenerateThirtyDayPlan(context: WorkspaceContext) {
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    plan.features.actions &&
    plan.features.thirty_day_plan &&
    canAccessWorkspace(context.workspace.accountState) &&
    canManageWorkspace(context.membership.role, context.workspace.accountState)
  );
}

export function canGenerateAssets(context: WorkspaceContext) {
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    plan.features.assets &&
    canAccessWorkspace(context.workspace.accountState) &&
    canManageWorkspace(context.membership.role, context.workspace.accountState) &&
    hasUsageRemaining(context, "asset_exports")
  );
}

export function canGenerateSops(context: WorkspaceContext) {
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    plan.features.sops &&
    canAccessWorkspace(context.workspace.accountState) &&
    canManageWorkspace(context.membership.role, context.workspace.accountState)
  );
}

export function canSubmitSupportRequest() {
  return true;
}

export function canRequestAccountDeletion() {
  return true;
}

export function canRequestWorkspaceDeletion(role: WorkspaceRole) {
  return ["owner", "admin"].includes(role);
}

export function getDeletionConfirmationPhrase(requestType: DeletionRequestType) {
  return requestType === "account_deletion"
    ? "DELETE MY ACCOUNT"
    : "DELETE WORKSPACE";
}

export function formatSupportIssueType(issueType: SupportIssueType) {
  switch (issueType) {
    case "product_question":
      return "Product question";
    case "account_access":
      return "Account access";
    case "diagnostics":
      return "Diagnostics";
    case "planning":
      return "Planning";
    case "assets":
      return "Assets";
    case "sops":
      return "SOPs";
    case "billing_state":
      return "Billing status";
    case "bug_report":
      return "Bug report";
    case "workspace_admin":
      return "Workspace admin";
    case "other":
      return "Other";
  }
}

export function formatSupportRequestStatus(status: SupportRequestStatus) {
  return status.replaceAll("_", " ");
}

export function formatDeletionRequestType(requestType: DeletionRequestType) {
  return requestType === "account_deletion"
    ? "Account deletion"
    : "Workspace deletion";
}

export function formatDeletionRequestStatus(status: DeletionRequestStatus) {
  return status.replaceAll("_", " ");
}

export function getAccountStateMeta(accountState: WorkspaceAccountState) {
  switch (accountState) {
    case "trial":
      return {
        tone: "teal",
        title: "Preview trial workspace",
        body:
          "This workspace is running in preview mode. Billing and automated provisioning are not live yet."
      };
    case "active":
      return {
        tone: "teal",
        title: "Active workspace",
        body: "This workspace has full product access for its current preview plan."
      };
    case "past_due":
      return {
        tone: "gold",
        title: "Past due preview state",
        body:
          "Access remains available for review, but write actions and member changes should be treated as limited until billing is reconciled."
      };
    case "canceled":
      return {
        tone: "gold",
        title: "Canceled workspace",
        body:
          "This workspace is in a read-only cancellation state. Reactivation and live billing are still manual in the MVP."
      };
    case "suspended":
      return {
        tone: "coral",
        title: "Suspended workspace",
        body:
          "This workspace is locked for operational review. Core product actions are disabled until an internal admin reactivates it."
      };
    case "archived":
      return {
        tone: "muted",
        title: "Archived workspace",
        body:
          "This workspace has been archived for retention and review. Editing actions are disabled in this state."
      };
    case "lead":
      return {
        tone: "gold",
        title: "Lead state",
        body:
          "This workspace has not been provisioned for app access yet. Complete setup before using the product."
      };
    default:
      return {
        tone: "teal",
        title: "Workspace ready",
        body: "The workspace foundation is provisioned and ready for internal preview use."
      };
  }
}

export function formatRoleLabel(role: WorkspaceRole | UserGlobalRole) {
  return role.replaceAll("_", " ");
}

export function getInternalAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
