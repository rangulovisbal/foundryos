import { z } from "zod";

import { copyForLanguage } from "@/lib/language";

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
export const workspaceAdminClosureActionOptions = [
  "suspend_access",
  "restore_access",
  "archive_workspace",
  "mark_deletion_review",
  "cancel_deletion_mark",
  "delete_test_workspace"
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
export type WorkspaceAdminClosureAction =
  (typeof workspaceAdminClosureActionOptions)[number];
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
  preferredLanguage: OutputLanguage | null;
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
  positioningStatement: string | null;
  channelUrls: string[];
  industry: string | null;
  businessModel: string | null;
  teamSize: string | null;
  geography: string | null;
  primaryOffer: string | null;
  targetAudience: string | null;
  conversionAction: string | null;
  pricingModel: string | null;
  acquisitionMethod: string | null;
  salesProcess: string | null;
  currentChannels: string[];
  currentTools: string[];
  primaryGoals: string[];
  biggestBottlenecks: string[];
  evidenceNotes: string | null;
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
  basedOn: string[];
  drivers?: Array<{
    label: string;
    points: number;
    tone: "positive" | "negative";
    basedOn: string[];
  }>;
};

export type DiagnosticFinding = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  basedOn?: string[];
};

export type DiagnosticOpportunity = {
  title: string;
  detail: string;
  impact: "low" | "medium" | "high";
  basedOn?: string[];
};

export type DiagnosticNextAction = {
  title: string;
  detail: string;
  owner: string;
  timeframe: string;
  basedOn?: string[];
};

export type DiagnosticEvidenceCard = {
  title: string;
  observation: string;
  implication: string;
  basedOn?: string[];
  signalQuality?: "strong" | "mixed" | "weak";
  evidenceQuality?: "clear" | "weak" | "missing" | "contradictory";
  needsValidation?: string[];
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
  workspaceId: string | null;
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
  language: z.enum(outputLanguageOptions).default("en"),
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
  plan: z.enum(workspacePlanOptions).default("growth-os"),
  language: z.enum(outputLanguageOptions).default("en")
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

export const adminBootstrapRequestSchema = z.object({
  token: z.string().trim().optional().default("")
});

export const workspaceAdminUpdateSchema = z.object({
  accountState: z.enum(workspaceAccountStateOptions),
  plan: z.enum(workspacePlanOptions)
});

export const workspaceAdminSettingsMutationSchema = z.object({
  mode: z.literal("settings"),
  accountState: z.enum(workspaceAccountStateOptions),
  plan: z.enum(workspacePlanOptions)
});

export const workspaceAdminClosureActionSchema = z
  .object({
    mode: z.literal("closure_action"),
    action: z.enum(workspaceAdminClosureActionOptions),
    note: z.string().trim().max(500).optional().default(""),
    confirmationText: z.string().trim().max(120).optional().default(""),
    restoreState: z.enum(["trial", "active"]).optional(),
    confirmedTestData: z.boolean().optional().default(false)
  })
  .superRefine((value, ctx) => {
    if (value.action === "restore_access" && !value.restoreState) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["restoreState"],
        message: "Choose the state to restore this workspace into."
      });
    }

    if (value.action === "delete_test_workspace" && !value.confirmedTestData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmedTestData"],
        message: "Confirm that you want to delete this workspace from admin."
      });
    }
  });

export const workspaceAdminMutationSchema = z.union([
  workspaceAdminSettingsMutationSchema,
  workspaceAdminClosureActionSchema
]);

export const adminUserDeleteSchema = z.object({
  note: z.string().trim().max(500).optional().default(""),
  confirmationText: z.string().trim().max(120, "Confirmation text is too long."),
  confirmedTestData: z.boolean().optional().default(false)
});

const optionalProfileText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .default("");

const urlPlaceholderValues = new Set([
  "na",
  "n/a",
  "none",
  "no website",
  "no website yet",
  "-"
]);

function normalizeProfileUrlValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (urlPlaceholderValues.has(trimmed.toLowerCase())) {
    return "";
  }

  return trimmed;
}

function isValidProfileUrl(value: string) {
  if (!value || /\s/.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

const optionalProfileUrl = (max = 255) =>
  z.preprocess(
    normalizeProfileUrlValue,
    z
      .string()
      .trim()
      .max(max)
      .refine(
        (value) => !value || isValidProfileUrl(value),
        "Leave this field blank if not available, or enter a valid full URL starting with http:// or https://."
      )
      .optional()
      .default("")
  );

const profileListSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(12)
  .optional()
  .default([]);

const profileUrlListSchema = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) {
      return value;
    }

    return value
      .map((item) => normalizeProfileUrlValue(item))
      .filter((item): item is string => typeof item === "string" && item.length > 0);
  },
  z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(255)
        .refine(
          (value) => isValidProfileUrl(value),
          "Leave this field blank if not available, or enter a valid full URL starting with http:// or https://."
        )
    )
    .max(8)
    .optional()
    .default([])
);

export const businessProfileSchema = z.object({
  outputLanguage: z.enum(outputLanguageOptions).default("en"),
  companyName: optionalProfileText(160),
  website: optionalProfileUrl(255),
  positioningStatement: optionalProfileText(500),
  channelUrls: profileUrlListSchema,
  industry: optionalProfileText(120),
  businessModel: optionalProfileText(120),
  teamSize: optionalProfileText(64),
  geography: optionalProfileText(160),
  primaryOffer: optionalProfileText(1200),
  targetAudience: optionalProfileText(1200),
  conversionAction: optionalProfileText(500),
  pricingModel: optionalProfileText(500),
  acquisitionMethod: optionalProfileText(700),
  salesProcess: optionalProfileText(900),
  currentChannels: profileListSchema,
  currentTools: profileListSchema,
  primaryGoals: profileListSchema,
  biggestBottlenecks: profileListSchema,
  evidenceNotes: optionalProfileText(1600),
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

export function formatPlanDescription(
  plan: WorkspacePlan,
  language: OutputLanguage = "en"
) {
  switch (plan) {
    case "snapshot":
      return copyForLanguage(
        language,
        "Paid diagnostic and 30-day operating plan.",
        "Diagnóstico de pago y plan operativo de 30 días."
      );
    case "growth-os":
      return copyForLanguage(
        language,
        "Recurring operating layer for lean teams.",
        "Capa operativa recurrente para equipos pequeños."
      );
    default:
      return getPlanDefinition(plan).description;
  }
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

export function isDestructiveWorkspaceAdminAction(
  action: WorkspaceAdminClosureAction
) {
  return [
    "suspend_access",
    "archive_workspace",
    "mark_deletion_review",
    "delete_test_workspace"
  ].includes(action);
}

export function getWorkspaceAdminConfirmationPhrase(
  action: WorkspaceAdminClosureAction
) {
  switch (action) {
    case "suspend_access":
      return "SUSPEND ACCESS";
    case "archive_workspace":
      return "ARCHIVE WORKSPACE";
    case "mark_deletion_review":
      return "MARK FOR DELETION";
    case "delete_test_workspace":
      return "DELETE TEST WORKSPACE";
    default:
      return "";
  }
}

export function formatWorkspaceAdminClosureAction(
  action: WorkspaceAdminClosureAction
) {
  switch (action) {
    case "suspend_access":
      return "Suspend access";
    case "restore_access":
      return "Restore access";
    case "archive_workspace":
      return "Archive workspace";
    case "mark_deletion_review":
      return "Mark for deletion review";
    case "cancel_deletion_mark":
      return "Cancel deletion mark";
    case "delete_test_workspace":
      return "Delete workspace now";
  }
}

const testDataMarkers = [
  "test",
  "smoke",
  "demo",
  "qa",
  "preview",
  "sandbox",
  "dummy",
  "codex",
  "fixture"
];

function normalizeTestSignal(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function isClearlyTestLikeValue(value: string | null | undefined) {
  const normalized = normalizeTestSignal(value);

  if (!normalized) {
    return false;
  }

  if (normalized.includes("example.com") || normalized.includes("localhost")) {
    return true;
  }

  return testDataMarkers.some((marker) => normalized.includes(marker));
}

export function isClearlyTestLikeUser(
  user: Pick<AppUser, "email" | "fullName">
) {
  return (
    isClearlyTestLikeValue(user.email) || isClearlyTestLikeValue(user.fullName)
  );
}

export function isClearlyTestLikeWorkspace(
  workspace: Pick<WorkspaceRecord, "name" | "slug">,
  owner?: Pick<AppUser, "email" | "fullName"> | null
) {
  return (
    isClearlyTestLikeValue(workspace.name) ||
    isClearlyTestLikeValue(workspace.slug) ||
    (owner ? isClearlyTestLikeUser(owner) : false)
  );
}

export function getDeleteTestAccountConfirmationPhrase() {
  return "DELETE ACCOUNT NOW";
}

export function getDeleteWorkspaceConfirmationPhrase() {
  return "DELETE WORKSPACE NOW";
}

export function getDeletionConfirmationPhrase(
  requestType: DeletionRequestType,
  language: OutputLanguage = "en"
) {
  if (requestType === "account_deletion") {
    return copyForLanguage(language, "DELETE MY ACCOUNT", "ELIMINAR MI CUENTA");
  }

  return copyForLanguage(language, "DELETE WORKSPACE", "ELIMINAR ESPACIO");
}

export function formatSupportIssueType(
  issueType: SupportIssueType,
  language: OutputLanguage = "en"
) {
  switch (issueType) {
    case "product_question":
      return copyForLanguage(language, "Product question", "Pregunta del producto");
    case "account_access":
      return copyForLanguage(language, "Account access", "Acceso a la cuenta");
    case "diagnostics":
      return copyForLanguage(language, "Diagnostics", "Diagnóstico");
    case "planning":
      return copyForLanguage(language, "Planning", "Planificación");
    case "assets":
      return copyForLanguage(language, "Assets", "Activos");
    case "sops":
      return "SOPs";
    case "billing_state":
      return copyForLanguage(language, "Billing status", "Estado de facturación");
    case "bug_report":
      return copyForLanguage(language, "Bug report", "Error del producto");
    case "workspace_admin":
      return copyForLanguage(language, "Workspace admin", "Administración del espacio");
    case "other":
      return copyForLanguage(language, "Other", "Otro");
  }
}

export function formatSupportRequestStatus(
  status: SupportRequestStatus,
  language: OutputLanguage = "en"
) {
  switch (status) {
    case "submitted":
      return copyForLanguage(language, "submitted", "enviada");
    case "triaged":
      return copyForLanguage(language, "triaged", "revisada");
    case "in_progress":
      return copyForLanguage(language, "in progress", "en progreso");
    case "resolved":
      return copyForLanguage(language, "resolved", "resuelta");
    case "closed":
      return copyForLanguage(language, "closed", "cerrada");
  }
}

export function formatDeletionRequestType(
  requestType: DeletionRequestType,
  language: OutputLanguage = "en"
) {
  return requestType === "account_deletion"
    ? copyForLanguage(language, "Account deletion", "Eliminación de cuenta")
    : copyForLanguage(language, "Workspace deletion", "Eliminación del espacio");
}

export function formatDeletionRequestStatus(
  status: DeletionRequestStatus,
  language: OutputLanguage = "en"
) {
  switch (status) {
    case "submitted":
      return copyForLanguage(language, "submitted", "enviada");
    case "under_review":
      return copyForLanguage(language, "under review", "en revisión");
    case "approved":
      return copyForLanguage(language, "approved", "aprobada");
    case "rejected":
      return copyForLanguage(language, "rejected", "rechazada");
    case "completed":
      return copyForLanguage(language, "completed", "completada");
  }
}

export function getAccountStateMeta(
  accountState: WorkspaceAccountState,
  language: OutputLanguage = "en"
) {
  switch (accountState) {
    case "trial":
      return {
        tone: "teal",
        title: copyForLanguage(language, "Preview trial workspace", "Espacio en prueba"),
        body: copyForLanguage(
          language,
          "This workspace is running in preview mode. Billing and automated provisioning are not live yet.",
          "Este espacio funciona en modo piloto. La facturación y el aprovisionamiento automático todavía no están activos."
        )
      };
    case "active":
      return {
        tone: "teal",
        title: copyForLanguage(language, "Active workspace", "Espacio activo"),
        body: copyForLanguage(
          language,
          "This workspace has full product access for its current preview plan.",
          "Este espacio tiene acceso completo al producto dentro de su plan piloto actual."
        )
      };
    case "past_due":
      return {
        tone: "gold",
        title: copyForLanguage(language, "Past due preview state", "Estado piloto con pago pendiente"),
        body: copyForLanguage(
          language,
          "Access remains available for review, but write actions and member changes should be treated as limited until billing is reconciled.",
          "El acceso sigue disponible para revisión, pero las acciones de escritura y los cambios de miembros deben considerarse limitados hasta regularizar la facturación."
        )
      };
    case "canceled":
      return {
        tone: "gold",
        title: copyForLanguage(language, "Canceled workspace", "Espacio cancelado"),
        body: copyForLanguage(
          language,
          "This workspace is in a read-only cancellation state. Reactivation and live billing are still manual in the MVP.",
          "Este espacio está en modo de solo lectura por cancelación. La reactivación y la facturación en vivo siguen siendo manuales en el MVP."
        )
      };
    case "suspended":
      return {
        tone: "coral",
        title: copyForLanguage(language, "Suspended workspace", "Espacio suspendido"),
        body: copyForLanguage(
          language,
          "This workspace is locked for operational review. Core product actions are disabled until an internal admin reactivates it.",
          "Este espacio está bloqueado para revisión operativa. Las acciones principales del producto están desactivadas hasta que un administrador interno lo reactive."
        )
      };
    case "archived":
      return {
        tone: "muted",
        title: copyForLanguage(language, "Archived workspace", "Espacio archivado"),
        body: copyForLanguage(
          language,
          "This workspace has been archived for retention and review. Editing actions are disabled in this state.",
          "Este espacio ha sido archivado para retención y revisión. Las acciones de edición están desactivadas en este estado."
        )
      };
    case "lead":
      return {
        tone: "gold",
        title: copyForLanguage(language, "Lead state", "Estado inicial"),
        body: copyForLanguage(
          language,
          "This workspace has not been provisioned for app access yet. Complete setup before using the product.",
          "Este espacio todavía no ha sido aprovisionado para acceder a la app. Completa la configuración antes de usar el producto."
        )
      };
    default:
      return {
        tone: "teal",
        title: copyForLanguage(language, "Workspace ready", "Espacio listo"),
        body: copyForLanguage(
          language,
          "The workspace foundation is provisioned and ready for internal preview use.",
          "La base del espacio está aprovisionada y lista para el uso piloto interno."
        )
      };
  }
}

export function formatAccountStateLabel(
  accountState: WorkspaceAccountState,
  language: OutputLanguage = "en"
) {
  switch (accountState) {
    case "trial":
      return copyForLanguage(language, "trial", "prueba");
    case "active":
      return copyForLanguage(language, "active", "activo");
    case "past_due":
      return copyForLanguage(language, "past due", "pago pendiente");
    case "canceled":
      return copyForLanguage(language, "canceled", "cancelado");
    case "suspended":
      return copyForLanguage(language, "suspended", "suspendido");
    case "archived":
      return copyForLanguage(language, "archived", "archivado");
    case "lead":
      return copyForLanguage(language, "lead", "inicial");
  }
}

export function formatRoleLabel(
  role: WorkspaceRole | UserGlobalRole,
  language: OutputLanguage = "en"
) {
  switch (role) {
    case "owner":
      return copyForLanguage(language, "owner", "propietario");
    case "admin":
      return "admin";
    case "member":
      return copyForLanguage(language, "member", "miembro");
    case "viewer":
      return copyForLanguage(language, "viewer", "lector");
    case "internal_admin":
      return copyForLanguage(language, "internal admin", "administrador interno");
    case "user":
      return copyForLanguage(language, "user", "usuario");
  }
}

export function getInternalAdminEmails() {
  return (process.env.INTERNAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
