import "server-only";

import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { requireDb } from "@/db/client";
import {
  adminAuditLogs,
  appSessions,
  appUsers,
  emailVerificationTokens,
  passwordResetTokens,
  workspaceInvitations,
  workspaceMemberships,
  workspaceUsageCounters,
  workspaces
} from "@/db/schema";
import type {
  AdminAuditLogRecord,
  AppSession,
  AppUser,
  EmailVerificationRecord,
  PasswordResetRecord,
  UsageCounterRecord,
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
