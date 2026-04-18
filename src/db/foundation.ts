import "server-only";

import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";

import { requireDb } from "@/db/client";
import {
  adminAuditLogs,
  actionPlans,
  assetJobs,
  appSessions,
  appUsers,
  businessAssets,
  diagnosticJobs,
  diagnosticResults,
  emailVerificationTokens,
  passwordResetTokens,
  planningJobs,
  roadmaps,
  sopArtifacts,
  sopJobs,
  thirtyDayPlans,
  workspaceBusinessProfiles,
  workspaceInvitations,
  workspaceMemberships,
  workspaceUsageCounters,
  workspaces
} from "@/db/schema";
import type {
  AdminAuditLogRecord,
  AssetJobRecord,
  AssetJobWithAssets,
  AppSession,
  AppUser,
  BusinessAssetRecord,
  BusinessProfileInput,
  BusinessProfileRecord,
  DiagnosticJobRecord,
  DiagnosticJobWithResult,
  DiagnosticResultRecord,
  EmailVerificationRecord,
  PasswordResetRecord,
  ActionPlanRecord,
  UsageCounterRecord,
  PlanningJobRecord,
  PlanningJobType,
  PlanningJobWithArtifacts,
  RoadmapRecord,
  SopArtifactRecord,
  SopJobRecord,
  SopJobWithArtifacts,
  ThirtyDayPlanRecord,
  WorkspaceInvitationRecord,
  WorkspaceMembershipRecord,
  WorkspaceMembershipView,
  WorkspaceRecord
} from "@/lib/foundation";

export type WorkspaceMemberRow = {
  membership: WorkspaceMembershipRecord;
  user: AppUser;
};

export type AdminAuditLogRow = {
  log: AdminAuditLogRecord;
  adminUser: Pick<AppUser, "id" | "email" | "fullName">;
  workspace: Pick<WorkspaceRecord, "id" | "name" | "slug">;
};

export type AdminDiagnosticJobRow = {
  job: DiagnosticJobRecord;
  workspace: Pick<WorkspaceRecord, "id" | "name" | "slug" | "plan" | "accountState">;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
  result: Pick<
    DiagnosticResultRecord,
    "id" | "overallMaturityScore" | "confidence" | "createdAt"
  > | null;
};

export type AdminPlanningJobRow = {
  job: PlanningJobRecord;
  workspace: Pick<WorkspaceRecord, "id" | "name" | "slug" | "plan" | "accountState">;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
  roadmap: Pick<RoadmapRecord, "id" | "createdAt"> | null;
  actionPlan: Pick<ActionPlanRecord, "id" | "createdAt"> | null;
  thirtyDayPlan: Pick<ThirtyDayPlanRecord, "id" | "createdAt"> | null;
};

export type AdminAssetJobRow = {
  job: AssetJobRecord;
  workspace: Pick<WorkspaceRecord, "id" | "name" | "slug" | "plan" | "accountState">;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
  assets: Array<Pick<BusinessAssetRecord, "id" | "assetType" | "title" | "generationStatus" | "createdAt">>;
};

export type AdminSopJobRow = {
  job: SopJobRecord;
  workspace: Pick<WorkspaceRecord, "id" | "name" | "slug" | "plan" | "accountState">;
  requestedByUser: Pick<AppUser, "id" | "email" | "fullName"> | null;
  artifacts: Array<Pick<SopArtifactRecord, "id" | "sopType" | "title" | "generationStatus" | "createdAt">>;
};

function mapUser(row: typeof appUsers.$inferSelect): AppUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    globalRole: row.globalRole as AppUser["globalRole"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapSession(row: typeof appSessions.$inferSelect): AppSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function mapWorkspace(row: typeof workspaces.$inferSelect): WorkspaceRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.ownerUserId,
    plan: row.plan as WorkspaceRecord["plan"],
    accountState: row.accountState as WorkspaceRecord["accountState"],
    outputLanguage: row.outputLanguage as WorkspaceRecord["outputLanguage"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapMembership(
  row: typeof workspaceMemberships.$inferSelect
): WorkspaceMembershipRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role as WorkspaceMembershipRecord["role"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapInvitation(
  row: typeof workspaceInvitations.$inferSelect
): WorkspaceInvitationRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    email: row.email,
    role: row.role as WorkspaceInvitationRecord["role"],
    tokenHash: row.tokenHash,
    invitedByUserId: row.invitedByUserId,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

function mapEmailVerification(
  row: typeof emailVerificationTokens.$inferSelect
): EmailVerificationRecord {
  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function mapPasswordReset(
  row: typeof passwordResetTokens.$inferSelect
): PasswordResetRecord {
  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function mapUsageCounter(
  row: typeof workspaceUsageCounters.$inferSelect
): UsageCounterRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    metricKey: row.metricKey as UsageCounterRecord["metricKey"],
    limitCount: row.limitCount,
    usedCount: row.usedCount,
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapBusinessProfile(
  row: typeof workspaceBusinessProfiles.$inferSelect
): BusinessProfileRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    companyName: row.companyName,
    website: row.website,
    industry: row.industry,
    businessModel: row.businessModel,
    teamSize: row.teamSize,
    geography: row.geography,
    primaryOffer: row.primaryOffer,
    targetAudience: row.targetAudience,
    currentChannels: row.currentChannels ?? [],
    currentTools: row.currentTools ?? [],
    primaryGoals: row.primaryGoals ?? [],
    biggestBottlenecks: row.biggestBottlenecks ?? [],
    budgetBand: row.budgetBand,
    lifecycleStage: row.lifecycleStage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDiagnosticJob(
  row: typeof diagnosticJobs.$inferSelect
): DiagnosticJobRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    requestedByUserId: row.requestedByUserId,
    status: row.status as DiagnosticJobRecord["status"],
    jobType: row.jobType,
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapDiagnosticResult(
  row: typeof diagnosticResults.$inferSelect
): DiagnosticResultRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    overallMaturityScore: row.overallMaturityScore,
    categoryScores: row.categoryScores,
    topBottlenecks: row.topBottlenecks as DiagnosticResultRecord["topBottlenecks"],
    topRisks: row.topRisks as DiagnosticResultRecord["topRisks"],
    topOpportunities: row.topOpportunities as DiagnosticResultRecord["topOpportunities"],
    confidence: row.confidence as DiagnosticResultRecord["confidence"],
    recommendedNextActions: row.recommendedNextActions,
    evidenceCards: row.evidenceCards,
    summary: row.summary,
    createdAt: row.createdAt.toISOString()
  };
}

function mapPlanningJob(row: typeof planningJobs.$inferSelect): PlanningJobRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    requestedByUserId: row.requestedByUserId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    jobType: row.jobType as PlanningJobRecord["jobType"],
    status: row.status as PlanningJobRecord["status"],
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapRoadmap(row: typeof roadmaps.$inferSelect): RoadmapRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    summary: row.summary,
    items: row.items as RoadmapRecord["items"],
    createdAt: row.createdAt.toISOString()
  };
}

function mapActionPlan(row: typeof actionPlans.$inferSelect): ActionPlanRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    sourceRoadmapId: row.sourceRoadmapId,
    actions: row.actions as ActionPlanRecord["actions"],
    createdAt: row.createdAt.toISOString()
  };
}

function mapThirtyDayPlan(row: typeof thirtyDayPlans.$inferSelect): ThirtyDayPlanRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    monthObjective: row.monthObjective,
    topPriorities: row.topPriorities,
    week1: row.week1,
    week2: row.week2,
    week3: row.week3,
    week4: row.week4,
    quickWins: row.quickWins,
    risksToAvoid: row.risksToAvoid,
    successSignals: row.successSignals,
    metricsToWatch: row.metricsToWatch,
    createdAt: row.createdAt.toISOString()
  };
}

function mapAssetJob(row: typeof assetJobs.$inferSelect): AssetJobRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    requestedByUserId: row.requestedByUserId,
    sourceBusinessProfileId: row.sourceBusinessProfileId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    sourceRoadmapId: row.sourceRoadmapId,
    sourceActionPlanId: row.sourceActionPlanId,
    sourceThirtyDayPlanId: row.sourceThirtyDayPlanId,
    status: row.status as AssetJobRecord["status"],
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapBusinessAsset(row: typeof businessAssets.$inferSelect): BusinessAssetRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    assetType: row.assetType as BusinessAssetRecord["assetType"],
    title: row.title,
    purpose: row.purpose,
    content: row.content,
    sourceReferences: row.sourceReferences as BusinessAssetRecord["sourceReferences"],
    generationStatus: row.generationStatus as BusinessAssetRecord["generationStatus"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapSopJob(row: typeof sopJobs.$inferSelect): SopJobRecord {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    requestedByUserId: row.requestedByUserId,
    sourceBusinessProfileId: row.sourceBusinessProfileId,
    sourceDiagnosticResultId: row.sourceDiagnosticResultId,
    sourceRoadmapId: row.sourceRoadmapId,
    sourceThirtyDayPlanId: row.sourceThirtyDayPlanId,
    status: row.status as SopJobRecord["status"],
    error: row.error,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapSopArtifact(row: typeof sopArtifacts.$inferSelect): SopArtifactRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    workspaceId: row.workspaceId,
    sopType: row.sopType as SopArtifactRecord["sopType"],
    title: row.title,
    purpose: row.purpose,
    content: row.content,
    sourceReferences: row.sourceReferences as SopArtifactRecord["sourceReferences"],
    generationStatus: row.generationStatus as SopArtifactRecord["generationStatus"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function mapAdminAuditLog(
  row: typeof adminAuditLogs.$inferSelect
): AdminAuditLogRecord {
  return {
    id: row.id,
    adminUserId: row.adminUserId,
    workspaceId: row.workspaceId,
    action: row.action,
    previousPlan: (row.previousPlan as AdminAuditLogRecord["previousPlan"]) ?? null,
    nextPlan: (row.nextPlan as AdminAuditLogRecord["nextPlan"]) ?? null,
    previousAccountState:
      (row.previousAccountState as AdminAuditLogRecord["previousAccountState"]) ?? null,
    nextAccountState:
      (row.nextAccountState as AdminAuditLogRecord["nextAccountState"]) ?? null,
    metadata: (row.metadata as AdminAuditLogRecord["metadata"]) ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export async function createUser(record: AppUser) {
  const db = await requireDb("user persistence");

  await db.insert(appUsers).values({
    id: record.id,
    email: record.email,
    fullName: record.fullName,
    passwordHash: record.passwordHash,
    emailVerifiedAt: record.emailVerifiedAt ? new Date(record.emailVerifiedAt) : null,
    globalRole: record.globalRole,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function listUsers() {
  const db = await requireDb("listing users");
  const rows = await db.select().from(appUsers).orderBy(desc(appUsers.createdAt));
  return rows.map(mapUser);
}

export async function findUserByEmail(email: string) {
  const db = await requireDb("user lookup");
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, normalizedEmail))
    .limit(1);

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function findUserById(userId: string) {
  const db = await requireDb("user lookup");
  const rows = await db.select().from(appUsers).where(eq(appUsers.id, userId)).limit(1);
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<AppUser, "passwordHash" | "emailVerifiedAt" | "globalRole" | "fullName">>
) {
  const db = await requireDb("user updates");
  const updatedAt = new Date().toISOString();

  await db
    .update(appUsers)
    .set({
      fullName: patch.fullName,
      passwordHash: patch.passwordHash,
      emailVerifiedAt:
        patch.emailVerifiedAt === undefined
          ? undefined
          : patch.emailVerifiedAt
            ? new Date(patch.emailVerifiedAt)
            : null,
      globalRole: patch.globalRole,
      updatedAt: new Date(updatedAt)
    })
    .where(eq(appUsers.id, userId));

  return findUserById(userId);
}

export async function createSession(record: AppSession) {
  const db = await requireDb("session persistence");

  await db.insert(appSessions).values({
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    expiresAt: new Date(record.expiresAt),
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function findSessionByTokenHash(tokenHash: string) {
  const db = await requireDb("session lookup");
  const rows = await db
    .select()
    .from(appSessions)
    .where(
      and(
        eq(appSessions.tokenHash, tokenHash),
        gt(appSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return rows[0] ? mapSession(rows[0]) : null;
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const db = await requireDb("session deletion");
  await db.delete(appSessions).where(eq(appSessions.tokenHash, tokenHash));
}

export async function deleteSessionsByUserId(userId: string) {
  const db = await requireDb("session invalidation");
  await db.delete(appSessions).where(eq(appSessions.userId, userId));
}

export async function createEmailVerification(record: EmailVerificationRecord) {
  const db = await requireDb("email verification persistence");

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, record.userId));
  await db.insert(emailVerificationTokens).values({
    id: record.id,
    userId: record.userId,
    email: record.email,
    tokenHash: record.tokenHash,
    expiresAt: new Date(record.expiresAt),
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function consumeEmailVerification(tokenHash: string) {
  const db = await requireDb("email verification consumption");

  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, row.id));
  return mapEmailVerification(row);
}

export async function createPasswordReset(record: PasswordResetRecord) {
  const db = await requireDb("password reset persistence");

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, record.userId));
  await db.insert(passwordResetTokens).values({
    id: record.id,
    userId: record.userId,
    email: record.email,
    tokenHash: record.tokenHash,
    expiresAt: new Date(record.expiresAt),
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function consumePasswordReset(tokenHash: string) {
  const db = await requireDb("password reset consumption");

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id));
  return mapPasswordReset(row);
}

export async function createWorkspaceBundle({
  workspace,
  membership,
  usage
}: {
  workspace: WorkspaceRecord;
  membership: WorkspaceMembershipRecord;
  usage: UsageCounterRecord[];
}) {
  const db = await requireDb("workspace provisioning");

  const insertWorkspace = db.insert(workspaces).values({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerUserId: workspace.ownerUserId,
    plan: workspace.plan,
    accountState: workspace.accountState,
    outputLanguage: workspace.outputLanguage,
    createdAt: new Date(workspace.createdAt),
    updatedAt: new Date(workspace.updatedAt)
  });

  const insertMembership = db.insert(workspaceMemberships).values({
    id: membership.id,
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    role: membership.role,
    createdAt: new Date(membership.createdAt),
    updatedAt: new Date(membership.updatedAt)
  });

  if (usage.length > 0) {
    const insertUsage = db.insert(workspaceUsageCounters).values(
      usage.map((item) => ({
        id: item.id,
        workspaceId: item.workspaceId,
        metricKey: item.metricKey,
        limitCount: item.limitCount,
        usedCount: item.usedCount,
        periodStart: new Date(item.periodStart),
        periodEnd: new Date(item.periodEnd),
        updatedAt: new Date(item.updatedAt)
      }))
    );

    await insertWorkspace;
    await insertMembership;
    await insertUsage;
    return workspace;
  }

  await insertWorkspace;
  await insertMembership;
  return workspace;
}

export async function findWorkspaceById(workspaceId: string) {
  const db = await requireDb("workspace lookup");
  const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  return rows[0] ? mapWorkspace(rows[0]) : null;
}

export async function listUserWorkspaceMemberships(userId: string) {
  const db = await requireDb("workspace membership lookup");
  const rows = await db
    .select({
      membership: workspaceMemberships,
      workspace: workspaces
    })
    .from(workspaceMemberships)
    .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))
    .where(eq(workspaceMemberships.userId, userId))
    .orderBy(desc(workspaces.createdAt));

  return rows.map(
    (row): WorkspaceMembershipView => ({
      membership: mapMembership(row.membership),
      workspace: mapWorkspace(row.workspace)
    })
  );
}

export async function findWorkspaceMembership(workspaceId: string, userId: string) {
  const db = await requireDb("workspace membership lookup");
  const rows = await db
    .select()
    .from(workspaceMemberships)
    .where(
      and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId)
      )
    )
    .limit(1);

  return rows[0] ? mapMembership(rows[0]) : null;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const db = await requireDb("workspace member lookup");
  const rows = await db
    .select({
      membership: workspaceMemberships,
      user: appUsers
    })
    .from(workspaceMemberships)
    .innerJoin(appUsers, eq(workspaceMemberships.userId, appUsers.id))
    .where(eq(workspaceMemberships.workspaceId, workspaceId))
    .orderBy(desc(workspaceMemberships.createdAt));

  return rows.map(
    (row): WorkspaceMemberRow => ({
      membership: mapMembership(row.membership),
      user: mapUser(row.user)
    })
  );
}

export async function createWorkspaceMembership(record: WorkspaceMembershipRecord) {
  const db = await requireDb("workspace membership creation");

  await db
    .insert(workspaceMemberships)
    .values({
      id: record.id,
      workspaceId: record.workspaceId,
      userId: record.userId,
      role: record.role,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    })
    .onConflictDoNothing({
      target: [workspaceMemberships.workspaceId, workspaceMemberships.userId]
    });

  return record;
}

export async function createWorkspaceInvitation(record: WorkspaceInvitationRecord) {
  const db = await requireDb("workspace invitation creation");

  await db
    .delete(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, record.workspaceId),
        eq(workspaceInvitations.email, record.email),
        isNull(workspaceInvitations.acceptedAt)
      )
    );

  await db.insert(workspaceInvitations).values({
    id: record.id,
    workspaceId: record.workspaceId,
    email: record.email,
    role: record.role,
    tokenHash: record.tokenHash,
    invitedByUserId: record.invitedByUserId,
    expiresAt: new Date(record.expiresAt),
    acceptedAt: record.acceptedAt ? new Date(record.acceptedAt) : null,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function listWorkspaceInvitations(workspaceId: string) {
  const db = await requireDb("workspace invitation lookup");
  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt));

  return rows.map(mapInvitation);
}

export async function findInvitationByTokenHash(tokenHash: string) {
  const db = await requireDb("workspace invitation lookup");
  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.tokenHash, tokenHash),
        gt(workspaceInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  return rows[0] ? mapInvitation(rows[0]) : null;
}

export async function acceptWorkspaceInvitation(invitationId: string, acceptedAt: string) {
  const db = await requireDb("workspace invitation acceptance");
  await db
    .update(workspaceInvitations)
    .set({ acceptedAt: new Date(acceptedAt) })
    .where(
      and(
        eq(workspaceInvitations.id, invitationId),
        isNull(workspaceInvitations.acceptedAt)
      )
    );
}

export async function listWorkspaceUsage(workspaceId: string) {
  const db = await requireDb("workspace usage lookup");
  const rows = await db
    .select()
    .from(workspaceUsageCounters)
    .where(eq(workspaceUsageCounters.workspaceId, workspaceId))
    .orderBy(desc(workspaceUsageCounters.metricKey));

  return rows.map(mapUsageCounter);
}

export async function incrementWorkspaceUsageCounter(
  workspaceId: string,
  metricKey: UsageCounterRecord["metricKey"]
) {
  const db = await requireDb("workspace usage updates");
  const usage = await listWorkspaceUsage(workspaceId);
  const counter = usage.find((item) => item.metricKey === metricKey);

  if (!counter) {
    throw new Error(`Missing usage counter for ${metricKey}.`);
  }

  await db
    .update(workspaceUsageCounters)
    .set({
      usedCount: counter.usedCount + 1,
      updatedAt: new Date()
    })
    .where(eq(workspaceUsageCounters.id, counter.id));

  return listWorkspaceUsage(workspaceId);
}

function toNullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeProfileList(values: string[] | undefined) {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean))
  ).slice(0, 12);
}

export async function getBusinessProfile(workspaceId: string) {
  const db = await requireDb("business profile lookup");
  const rows = await db
    .select()
    .from(workspaceBusinessProfiles)
    .where(eq(workspaceBusinessProfiles.workspaceId, workspaceId))
    .limit(1);

  return rows[0] ? mapBusinessProfile(rows[0]) : null;
}

export async function upsertBusinessProfile(
  workspaceId: string,
  input: BusinessProfileInput
) {
  const db = await requireDb("business profile persistence");
  const now = new Date();
  const values = {
    companyName: toNullableText(input.companyName),
    website: toNullableText(input.website),
    industry: toNullableText(input.industry),
    businessModel: toNullableText(input.businessModel),
    teamSize: toNullableText(input.teamSize),
    geography: toNullableText(input.geography),
    primaryOffer: toNullableText(input.primaryOffer),
    targetAudience: toNullableText(input.targetAudience),
    currentChannels: normalizeProfileList(input.currentChannels),
    currentTools: normalizeProfileList(input.currentTools),
    primaryGoals: normalizeProfileList(input.primaryGoals),
    biggestBottlenecks: normalizeProfileList(input.biggestBottlenecks),
    budgetBand: toNullableText(input.budgetBand),
    lifecycleStage: toNullableText(input.lifecycleStage),
    updatedAt: now
  };

  await db
    .insert(workspaceBusinessProfiles)
    .values({
      id: crypto.randomUUID(),
      workspaceId,
      ...values,
      createdAt: now
    })
    .onConflictDoUpdate({
      target: workspaceBusinessProfiles.workspaceId,
      set: values
    });

  return getBusinessProfile(workspaceId);
}

export async function createDiagnosticJob(record: DiagnosticJobRecord) {
  const db = await requireDb("diagnostic job persistence");

  await db.insert(diagnosticJobs).values({
    id: record.id,
    workspaceId: record.workspaceId,
    requestedByUserId: record.requestedByUserId,
    status: record.status,
    jobType: record.jobType,
    error: record.error,
    startedAt: record.startedAt ? new Date(record.startedAt) : null,
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function updateDiagnosticJob(
  jobId: string,
  patch: Partial<
    Pick<DiagnosticJobRecord, "status" | "error" | "startedAt" | "completedAt">
  >
) {
  const db = await requireDb("diagnostic job updates");

  await db
    .update(diagnosticJobs)
    .set({
      status: patch.status,
      error: patch.error,
      startedAt:
        patch.startedAt === undefined
          ? undefined
          : patch.startedAt
            ? new Date(patch.startedAt)
            : null,
      completedAt:
        patch.completedAt === undefined
          ? undefined
          : patch.completedAt
            ? new Date(patch.completedAt)
            : null,
      updatedAt: new Date()
    })
    .where(eq(diagnosticJobs.id, jobId));
}

export async function createDiagnosticResult(record: DiagnosticResultRecord) {
  const db = await requireDb("diagnostic result persistence");

  await db.insert(diagnosticResults).values({
    id: record.id,
    jobId: record.jobId,
    workspaceId: record.workspaceId,
    overallMaturityScore: record.overallMaturityScore,
    categoryScores: record.categoryScores,
    topBottlenecks: record.topBottlenecks,
    topRisks: record.topRisks,
    topOpportunities: record.topOpportunities,
    confidence: record.confidence,
    recommendedNextActions: record.recommendedNextActions,
    evidenceCards: record.evidenceCards,
    summary: record.summary,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function getLatestDiagnosticResult(workspaceId: string) {
  const db = await requireDb("latest diagnostic result lookup");
  const rows = await db
    .select()
    .from(diagnosticResults)
    .where(eq(diagnosticResults.workspaceId, workspaceId))
    .orderBy(desc(diagnosticResults.createdAt))
    .limit(1);

  return rows[0] ? mapDiagnosticResult(rows[0]) : null;
}

export async function listDiagnosticJobsWithResults(
  workspaceId: string,
  limit = 10
): Promise<DiagnosticJobWithResult[]> {
  const db = await requireDb("diagnostic history lookup");
  const rows = await db
    .select({
      job: diagnosticJobs,
      result: diagnosticResults
    })
    .from(diagnosticJobs)
    .leftJoin(diagnosticResults, eq(diagnosticResults.jobId, diagnosticJobs.id))
    .where(eq(diagnosticJobs.workspaceId, workspaceId))
    .orderBy(desc(diagnosticJobs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    job: mapDiagnosticJob(row.job),
    result: row.result ? mapDiagnosticResult(row.result) : null
  }));
}

export async function createPlanningJob(record: PlanningJobRecord) {
  const db = await requireDb("planning job persistence");

  await db.insert(planningJobs).values({
    id: record.id,
    workspaceId: record.workspaceId,
    requestedByUserId: record.requestedByUserId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    jobType: record.jobType,
    status: record.status,
    error: record.error,
    startedAt: record.startedAt ? new Date(record.startedAt) : null,
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function updatePlanningJob(
  jobId: string,
  patch: Partial<
    Pick<PlanningJobRecord, "status" | "error" | "startedAt" | "completedAt">
  >
) {
  const db = await requireDb("planning job updates");

  await db
    .update(planningJobs)
    .set({
      status: patch.status,
      error: patch.error,
      startedAt:
        patch.startedAt === undefined
          ? undefined
          : patch.startedAt
            ? new Date(patch.startedAt)
            : null,
      completedAt:
        patch.completedAt === undefined
          ? undefined
          : patch.completedAt
            ? new Date(patch.completedAt)
            : null,
      updatedAt: new Date()
    })
    .where(eq(planningJobs.id, jobId));
}

export async function createRoadmap(record: RoadmapRecord) {
  const db = await requireDb("roadmap persistence");

  await db.insert(roadmaps).values({
    id: record.id,
    jobId: record.jobId,
    workspaceId: record.workspaceId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    summary: record.summary,
    items: record.items,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function createActionPlan(record: ActionPlanRecord) {
  const db = await requireDb("action plan persistence");

  await db.insert(actionPlans).values({
    id: record.id,
    jobId: record.jobId,
    workspaceId: record.workspaceId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    sourceRoadmapId: record.sourceRoadmapId,
    actions: record.actions,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function createThirtyDayPlan(record: ThirtyDayPlanRecord) {
  const db = await requireDb("30-day plan persistence");

  await db.insert(thirtyDayPlans).values({
    id: record.id,
    jobId: record.jobId,
    workspaceId: record.workspaceId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    monthObjective: record.monthObjective,
    topPriorities: record.topPriorities,
    week1: record.week1,
    week2: record.week2,
    week3: record.week3,
    week4: record.week4,
    quickWins: record.quickWins,
    risksToAvoid: record.risksToAvoid,
    successSignals: record.successSignals,
    metricsToWatch: record.metricsToWatch,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function getLatestRoadmap(workspaceId: string) {
  const db = await requireDb("latest roadmap lookup");
  const rows = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.workspaceId, workspaceId))
    .orderBy(desc(roadmaps.createdAt))
    .limit(1);

  return rows[0] ? mapRoadmap(rows[0]) : null;
}

export async function getLatestActionPlan(workspaceId: string) {
  const db = await requireDb("latest action plan lookup");
  const rows = await db
    .select()
    .from(actionPlans)
    .where(eq(actionPlans.workspaceId, workspaceId))
    .orderBy(desc(actionPlans.createdAt))
    .limit(1);

  return rows[0] ? mapActionPlan(rows[0]) : null;
}

export async function getLatestThirtyDayPlan(workspaceId: string) {
  const db = await requireDb("latest 30-day plan lookup");
  const rows = await db
    .select()
    .from(thirtyDayPlans)
    .where(eq(thirtyDayPlans.workspaceId, workspaceId))
    .orderBy(desc(thirtyDayPlans.createdAt))
    .limit(1);

  return rows[0] ? mapThirtyDayPlan(rows[0]) : null;
}

export async function listPlanningJobsWithArtifacts({
  workspaceId,
  jobType,
  limit = 10
}: {
  workspaceId: string;
  jobType?: PlanningJobType;
  limit?: number;
}): Promise<PlanningJobWithArtifacts[]> {
  const db = await requireDb("planning job history lookup");
  const filters = [eq(planningJobs.workspaceId, workspaceId)];
  if (jobType) {
    filters.push(eq(planningJobs.jobType, jobType));
  }

  const rows = await db
    .select({
      job: planningJobs,
      roadmap: roadmaps,
      actionPlan: actionPlans,
      thirtyDayPlan: thirtyDayPlans
    })
    .from(planningJobs)
    .leftJoin(roadmaps, eq(roadmaps.jobId, planningJobs.id))
    .leftJoin(actionPlans, eq(actionPlans.jobId, planningJobs.id))
    .leftJoin(thirtyDayPlans, eq(thirtyDayPlans.jobId, planningJobs.id))
    .where(and(...filters))
    .orderBy(desc(planningJobs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    job: mapPlanningJob(row.job),
    roadmap: row.roadmap ? mapRoadmap(row.roadmap) : null,
    actionPlan: row.actionPlan ? mapActionPlan(row.actionPlan) : null,
    thirtyDayPlan: row.thirtyDayPlan ? mapThirtyDayPlan(row.thirtyDayPlan) : null
  }));
}

export async function createAssetJob(record: AssetJobRecord) {
  const db = await requireDb("asset job persistence");

  await db.insert(assetJobs).values({
    id: record.id,
    workspaceId: record.workspaceId,
    requestedByUserId: record.requestedByUserId,
    sourceBusinessProfileId: record.sourceBusinessProfileId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    sourceRoadmapId: record.sourceRoadmapId,
    sourceActionPlanId: record.sourceActionPlanId,
    sourceThirtyDayPlanId: record.sourceThirtyDayPlanId,
    status: record.status,
    error: record.error,
    startedAt: record.startedAt ? new Date(record.startedAt) : null,
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function updateAssetJob(
  jobId: string,
  patch: Partial<Pick<AssetJobRecord, "status" | "error" | "startedAt" | "completedAt">>
) {
  const db = await requireDb("asset job updates");

  await db
    .update(assetJobs)
    .set({
      status: patch.status,
      error: patch.error,
      startedAt:
        patch.startedAt === undefined
          ? undefined
          : patch.startedAt
            ? new Date(patch.startedAt)
            : null,
      completedAt:
        patch.completedAt === undefined
          ? undefined
          : patch.completedAt
            ? new Date(patch.completedAt)
            : null,
      updatedAt: new Date()
    })
    .where(eq(assetJobs.id, jobId));
}

export async function createBusinessAssets(records: BusinessAssetRecord[]) {
  if (records.length === 0) {
    return records;
  }

  const db = await requireDb("business asset persistence");

  await db.insert(businessAssets).values(
    records.map((record) => ({
      id: record.id,
      jobId: record.jobId,
      workspaceId: record.workspaceId,
      assetType: record.assetType,
      title: record.title,
      purpose: record.purpose,
      content: record.content,
      sourceReferences: record.sourceReferences,
      generationStatus: record.generationStatus,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }))
  );

  return records;
}

export async function listAssetJobsWithAssets({
  workspaceId,
  limit = 10
}: {
  workspaceId: string;
  limit?: number;
}): Promise<AssetJobWithAssets[]> {
  const db = await requireDb("asset job history lookup");
  const jobRows = await db
    .select()
    .from(assetJobs)
    .where(eq(assetJobs.workspaceId, workspaceId))
    .orderBy(desc(assetJobs.createdAt))
    .limit(limit);

  if (jobRows.length === 0) {
    return [];
  }

  const jobIds = jobRows.map((job) => job.id);
  const assetRows = await db
    .select()
    .from(businessAssets)
    .where(inArray(businessAssets.jobId, jobIds))
    .orderBy(desc(businessAssets.createdAt));
  const assetsByJobId = new Map<string, BusinessAssetRecord[]>();

  for (const row of assetRows) {
    const asset = mapBusinessAsset(row);
    const existing = assetsByJobId.get(asset.jobId) ?? [];
    existing.push(asset);
    assetsByJobId.set(asset.jobId, existing);
  }

  return jobRows.map((job) => ({
    job: mapAssetJob(job),
    assets: assetsByJobId.get(job.id) ?? []
  }));
}

export async function getLatestBusinessAssets(workspaceId: string) {
  const history = await listAssetJobsWithAssets({ workspaceId, limit: 10 });
  return (
    history.find((entry) => entry.job.status === "completed" && entry.assets.length > 0)
      ?.assets ?? []
  );
}

export async function syncSeatUsage(workspaceId: string) {
  const db = await requireDb("workspace seat usage sync");
  const [members, usage] = await Promise.all([
    listWorkspaceMembers(workspaceId),
    listWorkspaceUsage(workspaceId)
  ]);

  const seatsCounter = usage.find((counter) => counter.metricKey === "seats");
  if (!seatsCounter) {
    return;
  }

  await db
    .update(workspaceUsageCounters)
    .set({
      usedCount: members.length,
      updatedAt: new Date()
    })
    .where(eq(workspaceUsageCounters.id, seatsCounter.id));
}

export async function updateWorkspace(workspaceId: string, patch: Partial<WorkspaceRecord>) {
  const db = await requireDb("workspace updates");

  if (patch.ownerUserId) {
    const ownerMembership = await findWorkspaceMembership(workspaceId, patch.ownerUserId);

    if (!ownerMembership || ownerMembership.role !== "owner") {
      throw new Error(
        "Workspace ownership can only point at a user who already holds the owner membership."
      );
    }
  }

  await db
    .update(workspaces)
    .set({
      name: patch.name,
      slug: patch.slug,
      ownerUserId: patch.ownerUserId,
      plan: patch.plan,
      accountState: patch.accountState,
      outputLanguage: patch.outputLanguage,
      updatedAt: new Date()
    })
    .where(eq(workspaces.id, workspaceId));

  return findWorkspaceById(workspaceId);
}

export async function listWorkspaces() {
  const db = await requireDb("workspace listing");
  const rows = await db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  return rows.map(mapWorkspace);
}

export async function countUsers() {
  const db = await requireDb("user counting");
  const rows = await db.select({ id: appUsers.id }).from(appUsers);
  return rows.length;
}

export async function createAdminAuditLog(record: AdminAuditLogRecord) {
  const db = await requireDb("admin audit logging");

  await db.insert(adminAuditLogs).values({
    id: record.id,
    adminUserId: record.adminUserId,
    workspaceId: record.workspaceId,
    action: record.action,
    previousPlan: record.previousPlan,
    nextPlan: record.nextPlan,
    previousAccountState: record.previousAccountState,
    nextAccountState: record.nextAccountState,
    metadata: record.metadata,
    createdAt: new Date(record.createdAt)
  });

  return record;
}

export async function listAdminAuditLogs(limit = 20) {
  const db = await requireDb("admin audit lookup");
  const rows = await db
    .select({
      log: adminAuditLogs,
      adminUser: appUsers,
      workspace: workspaces
    })
    .from(adminAuditLogs)
    .innerJoin(appUsers, eq(adminAuditLogs.adminUserId, appUsers.id))
    .innerJoin(workspaces, eq(adminAuditLogs.workspaceId, workspaces.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit);

  return rows.map(
    (row): AdminAuditLogRow => ({
      log: mapAdminAuditLog(row.log),
      adminUser: {
        id: row.adminUser.id,
        email: row.adminUser.email,
        fullName: row.adminUser.fullName
      },
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug
      }
    })
  );
}

export async function listAdminDiagnosticJobs(limit = 20) {
  const db = await requireDb("admin diagnostic job lookup");
  const rows = await db
    .select({
      job: diagnosticJobs,
      workspace: workspaces,
      requestedByUser: appUsers,
      result: diagnosticResults
    })
    .from(diagnosticJobs)
    .innerJoin(workspaces, eq(diagnosticJobs.workspaceId, workspaces.id))
    .leftJoin(appUsers, eq(diagnosticJobs.requestedByUserId, appUsers.id))
    .leftJoin(diagnosticResults, eq(diagnosticResults.jobId, diagnosticJobs.id))
    .orderBy(desc(diagnosticJobs.createdAt))
    .limit(limit);

  return rows.map(
    (row): AdminDiagnosticJobRow => ({
      job: mapDiagnosticJob(row.job),
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        plan: row.workspace.plan as WorkspaceRecord["plan"],
        accountState: row.workspace.accountState as WorkspaceRecord["accountState"]
      },
      requestedByUser: row.requestedByUser
        ? {
            id: row.requestedByUser.id,
            email: row.requestedByUser.email,
            fullName: row.requestedByUser.fullName
          }
        : null,
      result: row.result
        ? {
            id: row.result.id,
            overallMaturityScore: row.result.overallMaturityScore,
            confidence: row.result.confidence as DiagnosticResultRecord["confidence"],
            createdAt: row.result.createdAt.toISOString()
          }
        : null
    })
  );
}

export async function listAdminPlanningJobs(limit = 20) {
  const db = await requireDb("admin planning job lookup");
  const rows = await db
    .select({
      job: planningJobs,
      workspace: workspaces,
      requestedByUser: appUsers,
      roadmap: roadmaps,
      actionPlan: actionPlans,
      thirtyDayPlan: thirtyDayPlans
    })
    .from(planningJobs)
    .innerJoin(workspaces, eq(planningJobs.workspaceId, workspaces.id))
    .leftJoin(appUsers, eq(planningJobs.requestedByUserId, appUsers.id))
    .leftJoin(roadmaps, eq(roadmaps.jobId, planningJobs.id))
    .leftJoin(actionPlans, eq(actionPlans.jobId, planningJobs.id))
    .leftJoin(thirtyDayPlans, eq(thirtyDayPlans.jobId, planningJobs.id))
    .orderBy(desc(planningJobs.createdAt))
    .limit(limit);

  return rows.map(
    (row): AdminPlanningJobRow => ({
      job: mapPlanningJob(row.job),
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        plan: row.workspace.plan as WorkspaceRecord["plan"],
        accountState: row.workspace.accountState as WorkspaceRecord["accountState"]
      },
      requestedByUser: row.requestedByUser
        ? {
            id: row.requestedByUser.id,
            email: row.requestedByUser.email,
            fullName: row.requestedByUser.fullName
          }
        : null,
      roadmap: row.roadmap
        ? {
            id: row.roadmap.id,
            createdAt: row.roadmap.createdAt.toISOString()
          }
        : null,
      actionPlan: row.actionPlan
        ? {
            id: row.actionPlan.id,
            createdAt: row.actionPlan.createdAt.toISOString()
          }
        : null,
      thirtyDayPlan: row.thirtyDayPlan
        ? {
            id: row.thirtyDayPlan.id,
            createdAt: row.thirtyDayPlan.createdAt.toISOString()
          }
        : null
    })
  );
}

export async function createSopJob(record: SopJobRecord) {
  const db = await requireDb("SOP job persistence");

  await db.insert(sopJobs).values({
    id: record.id,
    workspaceId: record.workspaceId,
    requestedByUserId: record.requestedByUserId,
    sourceBusinessProfileId: record.sourceBusinessProfileId,
    sourceDiagnosticResultId: record.sourceDiagnosticResultId,
    sourceRoadmapId: record.sourceRoadmapId,
    sourceThirtyDayPlanId: record.sourceThirtyDayPlanId,
    status: record.status,
    error: record.error,
    startedAt: record.startedAt ? new Date(record.startedAt) : null,
    completedAt: record.completedAt ? new Date(record.completedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function updateSopJob(
  jobId: string,
  patch: Partial<Pick<SopJobRecord, "status" | "error" | "startedAt" | "completedAt">>
) {
  const db = await requireDb("SOP job updates");

  await db
    .update(sopJobs)
    .set({
      status: patch.status,
      error: patch.error,
      startedAt:
        patch.startedAt === undefined
          ? undefined
          : patch.startedAt
            ? new Date(patch.startedAt)
            : null,
      completedAt:
        patch.completedAt === undefined
          ? undefined
          : patch.completedAt
            ? new Date(patch.completedAt)
            : null,
      updatedAt: new Date()
    })
    .where(eq(sopJobs.id, jobId));
}

export async function createSopArtifacts(records: SopArtifactRecord[]) {
  if (records.length === 0) {
    return records;
  }

  const db = await requireDb("SOP artifact persistence");

  await db.insert(sopArtifacts).values(
    records.map((record) => ({
      id: record.id,
      jobId: record.jobId,
      workspaceId: record.workspaceId,
      sopType: record.sopType,
      title: record.title,
      purpose: record.purpose,
      content: record.content,
      sourceReferences: record.sourceReferences,
      generationStatus: record.generationStatus,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    }))
  );

  return records;
}

export async function listSopJobsWithArtifacts({
  workspaceId,
  limit = 10
}: {
  workspaceId: string;
  limit?: number;
}): Promise<SopJobWithArtifacts[]> {
  const db = await requireDb("SOP job history lookup");
  const jobRows = await db
    .select()
    .from(sopJobs)
    .where(eq(sopJobs.workspaceId, workspaceId))
    .orderBy(desc(sopJobs.createdAt))
    .limit(limit);

  if (jobRows.length === 0) {
    return [];
  }

  const jobIds = jobRows.map((job) => job.id);
  const artifactRows = await db
    .select()
    .from(sopArtifacts)
    .where(inArray(sopArtifacts.jobId, jobIds))
    .orderBy(desc(sopArtifacts.createdAt));
  const artifactsByJobId = new Map<string, SopArtifactRecord[]>();

  for (const row of artifactRows) {
    const artifact = mapSopArtifact(row);
    const existing = artifactsByJobId.get(artifact.jobId) ?? [];
    existing.push(artifact);
    artifactsByJobId.set(artifact.jobId, existing);
  }

  return jobRows.map((job) => ({
    job: mapSopJob(job),
    artifacts: artifactsByJobId.get(job.id) ?? []
  }));
}

export async function getLatestSopArtifacts(workspaceId: string) {
  const history = await listSopJobsWithArtifacts({ workspaceId, limit: 10 });
  return (
    history.find((entry) => entry.job.status === "completed" && entry.artifacts.length > 0)
      ?.artifacts ?? []
  );
}

export async function listAdminAssetJobs(limit = 20) {
  const db = await requireDb("admin asset job lookup");
  const rows = await db
    .select({
      job: assetJobs,
      workspace: workspaces,
      requestedByUser: appUsers
    })
    .from(assetJobs)
    .innerJoin(workspaces, eq(assetJobs.workspaceId, workspaces.id))
    .leftJoin(appUsers, eq(assetJobs.requestedByUserId, appUsers.id))
    .orderBy(desc(assetJobs.createdAt))
    .limit(limit);

  if (rows.length === 0) {
    return [];
  }

  const assetRows = await db
    .select()
    .from(businessAssets)
    .where(inArray(businessAssets.jobId, rows.map((row) => row.job.id)))
    .orderBy(desc(businessAssets.createdAt));
  const assetsByJobId = new Map<string, BusinessAssetRecord[]>();

  for (const row of assetRows) {
    const asset = mapBusinessAsset(row);
    const existing = assetsByJobId.get(asset.jobId) ?? [];
    existing.push(asset);
    assetsByJobId.set(asset.jobId, existing);
  }

  return rows.map(
    (row): AdminAssetJobRow => ({
      job: mapAssetJob(row.job),
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        plan: row.workspace.plan as WorkspaceRecord["plan"],
        accountState: row.workspace.accountState as WorkspaceRecord["accountState"]
      },
      requestedByUser: row.requestedByUser
        ? {
            id: row.requestedByUser.id,
            email: row.requestedByUser.email,
            fullName: row.requestedByUser.fullName
          }
        : null,
      assets: (assetsByJobId.get(row.job.id) ?? []).map((asset) => ({
        id: asset.id,
        assetType: asset.assetType,
        title: asset.title,
        generationStatus: asset.generationStatus,
        createdAt: asset.createdAt
      }))
    })
  );
}

export async function listAdminSopJobs(limit = 20) {
  const db = await requireDb("admin SOP job lookup");
  const rows = await db
    .select({
      job: sopJobs,
      workspace: workspaces,
      requestedByUser: appUsers
    })
    .from(sopJobs)
    .innerJoin(workspaces, eq(sopJobs.workspaceId, workspaces.id))
    .leftJoin(appUsers, eq(sopJobs.requestedByUserId, appUsers.id))
    .orderBy(desc(sopJobs.createdAt))
    .limit(limit);

  if (rows.length === 0) {
    return [];
  }

  const artifactRows = await db
    .select()
    .from(sopArtifacts)
    .where(inArray(sopArtifacts.jobId, rows.map((row) => row.job.id)))
    .orderBy(desc(sopArtifacts.createdAt));
  const artifactsByJobId = new Map<string, SopArtifactRecord[]>();

  for (const row of artifactRows) {
    const artifact = mapSopArtifact(row);
    const existing = artifactsByJobId.get(artifact.jobId) ?? [];
    existing.push(artifact);
    artifactsByJobId.set(artifact.jobId, existing);
  }

  return rows.map(
    (row): AdminSopJobRow => ({
      job: mapSopJob(row.job),
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        plan: row.workspace.plan as WorkspaceRecord["plan"],
        accountState: row.workspace.accountState as WorkspaceRecord["accountState"]
      },
      requestedByUser: row.requestedByUser
        ? {
            id: row.requestedByUser.id,
            email: row.requestedByUser.email,
            fullName: row.requestedByUser.fullName
          }
        : null,
      artifacts: (artifactsByJobId.get(row.job.id) ?? []).map((artifact) => ({
        id: artifact.id,
        sopType: artifact.sopType,
        title: artifact.title,
        generationStatus: artifact.generationStatus,
        createdAt: artifact.createdAt
      }))
    })
  );
}
