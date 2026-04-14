import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
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
import {
  readLocalEmailVerifications,
  readLocalInvitations,
  readLocalMemberships,
  readLocalPasswordResets,
  readLocalSessions,
  readLocalUsageCounters,
  readLocalUsers,
  readLocalWorkspaces,
  writeLocalEmailVerifications,
  writeLocalInvitations,
  writeLocalMemberships,
  writeLocalPasswordResets,
  writeLocalSessions,
  writeLocalUsageCounters,
  writeLocalUsers,
  writeLocalWorkspaces
} from "@/lib/local-auth-store";

export type WorkspaceMemberRow = {
  membership: WorkspaceMembershipRecord;
  user: AppUser;
};

export async function createUser(record: AppUser) {
  const db = getDb();

  if (!db) {
    const users = await readLocalUsers();
    users.unshift(record);
    await writeLocalUsers(users);
    return record;
  }

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
  const db = getDb();

  if (!db) {
    return readLocalUsers();
  }

  const rows = await db.select().from(appUsers).orderBy(desc(appUsers.createdAt));
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    passwordHash: row.passwordHash,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    globalRole: row.globalRole as AppUser["globalRole"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();

  if (!db) {
    const users = await readLocalUsers();
    return users.find((user) => user.email === normalizedEmail) ?? null;
  }

  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, normalizedEmail))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

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

export async function findUserById(userId: string) {
  const db = getDb();

  if (!db) {
    const users = await readLocalUsers();
    return users.find((user) => user.id === userId) ?? null;
  }

  const rows = await db.select().from(appUsers).where(eq(appUsers.id, userId)).limit(1);
  const row = rows[0];

  if (!row) {
    return null;
  }

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

export async function updateUser(
  userId: string,
  patch: Partial<Pick<AppUser, "passwordHash" | "emailVerifiedAt" | "globalRole" | "fullName">>
) {
  const db = getDb();
  const updatedAt = new Date().toISOString();

  if (!db) {
    const users = await readLocalUsers();
    const nextUsers = users.map((user) =>
      user.id === userId ? { ...user, ...patch, updatedAt } : user
    );
    await writeLocalUsers(nextUsers);
    return nextUsers.find((user) => user.id === userId) ?? null;
  }

  await db
    .update(appUsers)
    .set({
      fullName: patch.fullName,
      passwordHash: patch.passwordHash,
      emailVerifiedAt: patch.emailVerifiedAt ? new Date(patch.emailVerifiedAt) : undefined,
      globalRole: patch.globalRole,
      updatedAt: new Date(updatedAt)
    })
    .where(eq(appUsers.id, userId));

  return findUserById(userId);
}

export async function createSession(record: AppSession) {
  const db = getDb();

  if (!db) {
    const sessions = await readLocalSessions();
    sessions.unshift(record);
    await writeLocalSessions(sessions);
    return record;
  }

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
  const now = new Date().toISOString();
  const db = getDb();

  if (!db) {
    const sessions = await readLocalSessions();
    return (
      sessions.find(
        (session) => session.tokenHash === tokenHash && session.expiresAt > now
      ) ?? null
    );
  }

  const rows = await db
    .select()
    .from(appSessions)
    .where(and(eq(appSessions.tokenHash, tokenHash), gt(appSessions.expiresAt, new Date(now))))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const db = getDb();

  if (!db) {
    const sessions = await readLocalSessions();
    await writeLocalSessions(sessions.filter((session) => session.tokenHash !== tokenHash));
    return;
  }

  await db.delete(appSessions).where(eq(appSessions.tokenHash, tokenHash));
}

export async function createEmailVerification(record: EmailVerificationRecord) {
  const db = getDb();

  if (!db) {
    const tokens = (await readLocalEmailVerifications()).filter(
      (token) => token.userId !== record.userId
    );
    tokens.unshift(record);
    await writeLocalEmailVerifications(tokens);
    return record;
  }

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, record.userId));
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
  const now = new Date().toISOString();
  const db = getDb();

  if (!db) {
    const tokens = await readLocalEmailVerifications();
    const match =
      tokens.find((token) => token.tokenHash === tokenHash && token.expiresAt > now) ?? null;
    if (!match) {
      return null;
    }
    await writeLocalEmailVerifications(tokens.filter((token) => token.id !== match.id));
    return match;
  }

  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gt(emailVerificationTokens.expiresAt, new Date(now))
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, row.id));

  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

export async function createPasswordReset(record: PasswordResetRecord) {
  const db = getDb();

  if (!db) {
    const tokens = (await readLocalPasswordResets()).filter(
      (token) => token.userId !== record.userId
    );
    tokens.unshift(record);
    await writeLocalPasswordResets(tokens);
    return record;
  }

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, record.userId));
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
  const now = new Date().toISOString();
  const db = getDb();

  if (!db) {
    const tokens = await readLocalPasswordResets();
    const match =
      tokens.find((token) => token.tokenHash === tokenHash && token.expiresAt > now) ?? null;
    if (!match) {
      return null;
    }
    await writeLocalPasswordResets(tokens.filter((token) => token.id !== match.id));
    return match;
  }

  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date(now))
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id));

  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
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
  const db = getDb();

  if (!db) {
    const workspacesStore = await readLocalWorkspaces();
    const membershipsStore = await readLocalMemberships();
    const usageStore = await readLocalUsageCounters();
    workspacesStore.unshift(workspace);
    membershipsStore.unshift(membership);
    usageStore.unshift(...usage);
    await writeLocalWorkspaces(workspacesStore);
    await writeLocalMemberships(membershipsStore);
    await writeLocalUsageCounters(usageStore);
    return workspace;
  }

  await db.insert(workspaces).values({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    ownerUserId: workspace.ownerUserId,
    plan: workspace.plan,
    accountState: workspace.accountState,
    createdAt: new Date(workspace.createdAt),
    updatedAt: new Date(workspace.updatedAt)
  });

  await db.insert(workspaceMemberships).values({
    id: membership.id,
    workspaceId: membership.workspaceId,
    userId: membership.userId,
    role: membership.role,
    createdAt: new Date(membership.createdAt),
    updatedAt: new Date(membership.updatedAt)
  });

  if (usage.length > 0) {
    await db.insert(workspaceUsageCounters).values(
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
  }

  return workspace;
}

export async function findWorkspaceById(workspaceId: string) {
  const db = getDb();

  if (!db) {
    const workspacesStore = await readLocalWorkspaces();
    return workspacesStore.find((workspace) => workspace.id === workspaceId) ?? null;
  }

  const rows = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const row = rows[0];

  if (!row) {
    return null;
  }

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

export async function listUserWorkspaceMemberships(userId: string) {
  const db = getDb();

  if (!db) {
    const [membershipsStore, workspacesStore] = await Promise.all([
      readLocalMemberships(),
      readLocalWorkspaces()
    ]);

    return membershipsStore
      .filter((membership) => membership.userId === userId)
      .map((membership) => ({
        membership,
        workspace:
          workspacesStore.find((workspace) => workspace.id === membership.workspaceId) ??
          null
      }))
      .filter(
        (
          item
        ): item is {
          membership: WorkspaceMembershipRecord;
          workspace: WorkspaceRecord;
        } => Boolean(item.workspace)
      );
  }

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
      membership: {
        id: row.membership.id,
        workspaceId: row.membership.workspaceId,
        userId: row.membership.userId,
        role: row.membership.role as WorkspaceMembershipRecord["role"],
        createdAt: row.membership.createdAt.toISOString(),
        updatedAt: row.membership.updatedAt.toISOString()
      },
      workspace: {
        id: row.workspace.id,
        name: row.workspace.name,
        slug: row.workspace.slug,
        ownerUserId: row.workspace.ownerUserId,
        plan: row.workspace.plan as WorkspaceRecord["plan"],
        accountState: row.workspace.accountState as WorkspaceRecord["accountState"],
        createdAt: row.workspace.createdAt.toISOString(),
        updatedAt: row.workspace.updatedAt.toISOString()
      }
    })
  );
}

export async function findWorkspaceMembership(workspaceId: string, userId: string) {
  const db = getDb();

  if (!db) {
    const membershipsStore = await readLocalMemberships();
    return (
      membershipsStore.find(
        (membership) =>
          membership.workspaceId === workspaceId && membership.userId === userId
      ) ?? null
    );
  }

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

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role as WorkspaceMembershipRecord["role"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function listWorkspaceMembers(workspaceId: string) {
  const db = getDb();

  if (!db) {
    const [membershipsStore, usersStore] = await Promise.all([
      readLocalMemberships(),
      readLocalUsers()
    ]);

    return membershipsStore
      .filter((membership) => membership.workspaceId === workspaceId)
      .map((membership) => ({
        membership,
        user: usersStore.find((user) => user.id === membership.userId) ?? null
      }))
      .filter(
        (
          item
        ): item is {
          membership: WorkspaceMembershipRecord;
          user: AppUser;
        } => Boolean(item.user)
      );
  }

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
      membership: {
        id: row.membership.id,
        workspaceId: row.membership.workspaceId,
        userId: row.membership.userId,
        role: row.membership.role as WorkspaceMembershipRecord["role"],
        createdAt: row.membership.createdAt.toISOString(),
        updatedAt: row.membership.updatedAt.toISOString()
      },
      user: {
        id: row.user.id,
        email: row.user.email,
        fullName: row.user.fullName,
        passwordHash: row.user.passwordHash,
        emailVerifiedAt: row.user.emailVerifiedAt?.toISOString() ?? null,
        globalRole: row.user.globalRole as AppUser["globalRole"],
        createdAt: row.user.createdAt.toISOString(),
        updatedAt: row.user.updatedAt.toISOString()
      }
    })
  );
}

export async function createWorkspaceMembership(record: WorkspaceMembershipRecord) {
  const db = getDb();

  if (!db) {
    const membershipsStore = await readLocalMemberships();
    membershipsStore.unshift(record);
    await writeLocalMemberships(membershipsStore);
    return record;
  }

  await db.insert(workspaceMemberships).values({
    id: record.id,
    workspaceId: record.workspaceId,
    userId: record.userId,
    role: record.role,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  });

  return record;
}

export async function createWorkspaceInvitation(record: WorkspaceInvitationRecord) {
  const db = getDb();

  if (!db) {
    const invitations = await readLocalInvitations();
    invitations.unshift(record);
    await writeLocalInvitations(invitations);
    return record;
  }

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
  const db = getDb();

  if (!db) {
    const invitations = await readLocalInvitations();
    return invitations
      .filter((invitation) => invitation.workspaceId === workspaceId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId))
    .orderBy(desc(workspaceInvitations.createdAt));

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    email: row.email,
    role: row.role as WorkspaceInvitationRecord["role"],
    tokenHash: row.tokenHash,
    invitedByUserId: row.invitedByUserId,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function findInvitationByTokenHash(tokenHash: string) {
  const now = new Date().toISOString();
  const db = getDb();

  if (!db) {
    const invitations = await readLocalInvitations();
    return (
      invitations.find(
        (invitation) =>
          invitation.tokenHash === tokenHash &&
          invitation.expiresAt > now &&
          !invitation.acceptedAt
      ) ?? null
    );
  }

  const rows = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.tokenHash, tokenHash),
        gt(workspaceInvitations.expiresAt, new Date(now))
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row || row.acceptedAt) {
    return null;
  }

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    email: row.email,
    role: row.role as WorkspaceInvitationRecord["role"],
    tokenHash: row.tokenHash,
    invitedByUserId: row.invitedByUserId,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: null,
    createdAt: row.createdAt.toISOString()
  };
}

export async function acceptWorkspaceInvitation(invitationId: string, acceptedAt: string) {
  const db = getDb();

  if (!db) {
    const invitations = await readLocalInvitations();
    const nextInvitations = invitations.map((invitation) =>
      invitation.id === invitationId ? { ...invitation, acceptedAt } : invitation
    );
    await writeLocalInvitations(nextInvitations);
    return;
  }

  await db
    .update(workspaceInvitations)
    .set({ acceptedAt: new Date(acceptedAt) })
    .where(eq(workspaceInvitations.id, invitationId));
}

export async function listWorkspaceUsage(workspaceId: string) {
  const db = getDb();

  if (!db) {
    const usage = await readLocalUsageCounters();
    return usage
      .filter((counter) => counter.workspaceId === workspaceId)
      .sort((left, right) => left.metricKey.localeCompare(right.metricKey));
  }

  const rows = await db
    .select()
    .from(workspaceUsageCounters)
    .where(eq(workspaceUsageCounters.workspaceId, workspaceId));

  return rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspaceId,
    metricKey: row.metricKey as UsageCounterRecord["metricKey"],
    limitCount: row.limitCount,
    usedCount: row.usedCount,
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function syncSeatUsage(workspaceId: string) {
  const [members, usage] = await Promise.all([
    listWorkspaceMembers(workspaceId),
    listWorkspaceUsage(workspaceId)
  ]);

  const seatsCounter = usage.find((counter) => counter.metricKey === "seats");
  if (!seatsCounter) {
    return;
  }

  const nextUsedCount = members.length;
  const updatedAt = new Date().toISOString();
  const db = getDb();

  if (!db) {
    const counters = await readLocalUsageCounters();
    const nextCounters = counters.map((counter) =>
      counter.id === seatsCounter.id
        ? { ...counter, usedCount: nextUsedCount, updatedAt }
        : counter
    );
    await writeLocalUsageCounters(nextCounters);
    return;
  }

  await db
    .update(workspaceUsageCounters)
    .set({
      usedCount: nextUsedCount,
      updatedAt: new Date(updatedAt)
    })
    .where(eq(workspaceUsageCounters.id, seatsCounter.id));
}

export async function updateWorkspace(workspaceId: string, patch: Partial<WorkspaceRecord>) {
  const db = getDb();
  const updatedAt = new Date().toISOString();

  if (!db) {
    const workspaceStore = await readLocalWorkspaces();
    const nextWorkspaces = workspaceStore.map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, ...patch, updatedAt } : workspace
    );
    await writeLocalWorkspaces(nextWorkspaces);
    return nextWorkspaces.find((workspace) => workspace.id === workspaceId) ?? null;
  }

  await db
    .update(workspaces)
    .set({
      name: patch.name,
      slug: patch.slug,
      ownerUserId: patch.ownerUserId,
      plan: patch.plan,
      accountState: patch.accountState,
      updatedAt: new Date(updatedAt)
    })
    .where(eq(workspaces.id, workspaceId));

  return findWorkspaceById(workspaceId);
}

export async function listWorkspaces() {
  const db = getDb();

  if (!db) {
    const workspaceStore = await readLocalWorkspaces();
    return workspaceStore.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  const rows = await db.select().from(workspaces).orderBy(desc(workspaces.createdAt));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerUserId: row.ownerUserId,
    plan: row.plan as WorkspaceRecord["plan"],
    accountState: row.accountState as WorkspaceRecord["accountState"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }));
}

export async function countUsers() {
  const db = getDb();

  if (!db) {
    const users = await readLocalUsers();
    return users.length;
  }

  const users = await db.select({ id: appUsers.id }).from(appUsers);
  return users.length;
}
