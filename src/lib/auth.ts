import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import {
  acceptWorkspaceInvitation,
  deleteSessionsByUserId,
  consumeEmailVerification,
  consumePasswordReset,
  createAdminAuditLog,
  createEmailVerification,
  createPasswordReset,
  createSession,
  createUser,
  createWorkspaceBundle,
  createWorkspaceInvitation,
  createWorkspaceMembership,
  deleteSessionByTokenHash,
  findInvitationByTokenHash,
  findWorkspaceMembership,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  listUserWorkspaceMemberships,
  listWorkspaceMembers,
  listWorkspaceUsage,
  listWorkspaces,
  syncSeatUsage,
  updateUser
} from "@/db/foundation";
import { env } from "@/lib/env";
import { isConfigurationError } from "@/lib/errors";
import {
  type AdminAuditLogRecord,
  type AppUser,
  type WorkspaceContext,
  type WorkspaceRecord,
  getInternalAdminEmails,
  seedUsageCounters,
  slugifyWorkspaceName,
  type WorkspaceInvitationRecord,
  workspaceCreationSchema
} from "@/lib/foundation";
import {
  type WorkspacePlan,
  canManageWorkspace,
  getPlanDefinition
} from "@/lib/foundation";
import { sendTransactionalEmail } from "@/lib/email";
import { createRawToken, hashPassword, hashToken, verifyPassword } from "@/lib/security";

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-foundry_session"
    : "foundry_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const INTERNAL_ADMIN_BOOTSTRAP_EMAIL = "internal-admin@preview.foundryos.local";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createExpiry(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

function buildAbsoluteUrl(path: string) {
  return `${env.appUrl}${path}`;
}

async function sendPreviewAwareEmail({
  to,
  subject,
  text,
  previewPath
}: {
  to: string;
  subject: string;
  text: string;
  previewPath: string;
}) {
  const previewUrl = buildAbsoluteUrl(previewPath);
  const delivery = await sendTransactionalEmail({ to, subject, text });

  if (delivery.delivered) {
    return { ...delivery, previewUrl: null, deliveryMode: "email" as const };
  }

  if (env.allowAuthPreviewLinks) {
    return { ...delivery, previewUrl, deliveryMode: "preview_link" as const };
  }

  return { ...delivery, previewUrl: null, deliveryMode: "unavailable" as const };
}

function resolveGlobalRole(email: string): AppUser["globalRole"] {
  return getInternalAdminEmails().includes(normalizeEmail(email))
    ? "internal_admin"
    : "user";
}

export function setSessionCookie(response: NextResponse, rawToken: string, expiresAt: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function startSessionForUser(userId: string, response: NextResponse) {
  const rawToken = createRawToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await createSession({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    createdAt: new Date().toISOString()
  });

  setSessionCookie(response, rawToken, expiresAt);
}

export async function getCurrentUserSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await findSessionByTokenHash(hashToken(rawToken));
  if (!session) {
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    await deleteSessionByTokenHash(hashToken(rawToken));
    return null;
  }

  return { rawToken, session, user };
}

export async function requireAuthenticatedUser(redirectTo?: string) {
  const session = await getCurrentUserSession();

  if (!session) {
    redirect(`/login?redirectTo=${encodeURIComponent(redirectTo ?? "/app")}`);
  }

  return session;
}

export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext | null> {
  const current = await getCurrentUserSession();

  if (!current) {
    return null;
  }

  const memberships = await listUserWorkspaceMemberships(current.user.id);
  const firstMembership = memberships[0];

  if (!firstMembership) {
    return null;
  }

  const usage = await listWorkspaceUsage(firstMembership.workspace.id);

  return {
    user: current.user,
    workspace: firstMembership.workspace,
    membership: firstMembership.membership,
    usage
  };
}

export async function requireWorkspaceContext(redirectTo?: string) {
  const current = await requireAuthenticatedUser(redirectTo ?? "/app");
  const memberships = await listUserWorkspaceMemberships(current.user.id);

  if (memberships.length === 0) {
    redirect("/app/setup");
  }

  const primary = memberships[0];
  const usage = await listWorkspaceUsage(primary.workspace.id);

  return {
    user: current.user,
    workspace: primary.workspace,
    membership: primary.membership,
    usage
  };
}

export async function requireInternalAdmin() {
  const current = await getCurrentUserSession();

  if (!current) {
    redirect("/admin/login");
  }

  if (current.user.globalRole !== "internal_admin") {
    redirect("/app/dashboard?forbidden=admin");
  }

  return current.user;
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error("An account already exists for this email.");
  }

  const now = new Date().toISOString();
  const user: AppUser = {
    id: crypto.randomUUID(),
    email,
    fullName: input.fullName.trim(),
    passwordHash: hashPassword(input.password),
    emailVerifiedAt: null,
    globalRole: resolveGlobalRole(email),
    createdAt: now,
    updatedAt: now
  };

  await createUser(user);

  const rawToken = createRawToken();
  await createEmailVerification({
    id: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    tokenHash: hashToken(rawToken),
    expiresAt: createExpiry(24),
    createdAt: now
  });

  const verificationPath = `/api/auth/verify-email?token=${rawToken}`;
  const delivery = await sendPreviewAwareEmail({
    to: user.email,
    subject: "Verify your FoundryOS account",
    text:
      `Hi ${user.fullName},\n\n` +
      `Verify your account to access the internal MVP preview:\n${buildAbsoluteUrl(
        verificationPath
      )}\n\n` +
      "If you did not request this account, you can ignore this email.",
    previewPath: verificationPath
  });

  return {
    user,
    verificationPreviewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered,
    deliveryMode: delivery.deliveryMode
  };
}

export async function verifyEmailAndCreateSession(rawToken: string, response: NextResponse) {
  const verification = await consumeEmailVerification(hashToken(rawToken));

  if (!verification) {
    throw new Error("This verification link is invalid or expired.");
  }

  await updateUser(verification.userId, {
    emailVerifiedAt: new Date().toISOString()
  });

  await startSessionForUser(verification.userId, response);
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  let user = await findUserByEmail(email);

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  if (resolveGlobalRole(email) === "internal_admin" && user.globalRole !== "internal_admin") {
    user = (await updateUser(user.id, {
      globalRole: "internal_admin"
    })) as AppUser;
  }

  if (!user.emailVerifiedAt) {
    const rawToken = createRawToken();
    await createEmailVerification({
      id: crypto.randomUUID(),
      userId: user.id,
      email: user.email,
      tokenHash: hashToken(rawToken),
      expiresAt: createExpiry(24),
      createdAt: new Date().toISOString()
    });

    const verificationPath = `/api/auth/verify-email?token=${rawToken}`;
    const delivery = await sendPreviewAwareEmail({
      to: user.email,
      subject: "Verify your FoundryOS account",
      text:
        `Hi ${user.fullName},\n\n` +
        `Verify your account to access the internal MVP preview:\n${buildAbsoluteUrl(
          verificationPath
        )}\n\n` +
        "If you did not request this account, you can ignore this email.",
      previewPath: verificationPath
    });

    return {
      user: null,
      requiresVerification: true,
      verificationPreviewUrl: delivery.previewUrl,
      emailDelivery: delivery.delivered,
      deliveryMode: delivery.deliveryMode
    };
  }

  return {
    user,
    requiresVerification: false,
    verificationPreviewUrl: null,
    emailDelivery: true,
    deliveryMode: "email" as const
  };
}

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(normalizeEmail(email));

  if (!user) {
    return {
      requested: true,
      previewUrl: null,
      emailDelivery: true
    };
  }

  const rawToken = createRawToken();
  await createPasswordReset({
    id: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    tokenHash: hashToken(rawToken),
    expiresAt: createExpiry(2),
    createdAt: new Date().toISOString()
  });

  const resetPath = `/reset-password?token=${rawToken}`;
  const delivery = await sendPreviewAwareEmail({
    to: user.email,
    subject: "Reset your FoundryOS password",
    text:
      `Hi ${user.fullName},\n\n` +
      `Use the link below to reset your password:\n${buildAbsoluteUrl(resetPath)}\n\n` +
      "If you did not request a reset, you can ignore this email.",
    previewPath: resetPath
  });

  return {
    requested: true,
    previewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered
  };
}

export async function resetPasswordFromToken(token: string, password: string) {
  const reset = await consumePasswordReset(hashToken(token));

  if (!reset) {
    throw new Error("This reset link is invalid or expired.");
  }

  await updateUser(reset.userId, {
    passwordHash: hashPassword(password)
  });
  await deleteSessionsByUserId(reset.userId);
}

async function createUniqueWorkspaceSlug(name: string) {
  const base = slugifyWorkspaceName(name) || "workspace";
  const existing = await listWorkspaces();
  let slug = base;
  let counter = 1;

  while (existing.some((workspace) => workspace.slug === slug)) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

export async function createWorkspaceForUser(input: {
  user: AppUser;
  name: string;
  plan?: WorkspacePlan;
}) {
  const existing = await listUserWorkspaceMemberships(input.user.id);

  if (existing.length > 0) {
    throw new Error("This preview currently supports one workspace per user.");
  }

  const parsed = workspaceCreationSchema.parse({
    name: input.name,
    plan: input.plan ?? "growth-os"
  });

  const now = new Date().toISOString();
  const workspaceId = crypto.randomUUID();
  const workspace: WorkspaceRecord = {
    id: workspaceId,
    name: parsed.name.trim(),
    slug: await createUniqueWorkspaceSlug(parsed.name),
    ownerUserId: input.user.id,
    plan: parsed.plan,
    accountState: "trial",
    createdAt: now,
    updatedAt: now
  };

  const membership = {
    id: crypto.randomUUID(),
    workspaceId,
    userId: input.user.id,
    role: "owner" as const,
    createdAt: now,
    updatedAt: now
  };

  const usage = seedUsageCounters(workspaceId, workspace.plan);

  await createWorkspaceBundle({
    workspace,
    membership,
    usage
  });

  return workspace;
}

export async function inviteUserToWorkspace(input: {
  workspaceId: string;
  actor: WorkspaceContext;
  email: string;
  role: WorkspaceInvitationRecord["role"];
}) {
  if (!canManageWorkspace(input.actor.membership.role, input.actor.workspace.accountState)) {
    throw new Error("You do not have permission to invite members in this workspace.");
  }

  if (!getPlanDefinition(input.actor.workspace.plan).features.team) {
    throw new Error("Team invites are not available on this plan.");
  }

  const normalizedEmail = normalizeEmail(input.email);
  const members = await listWorkspaceMembers(input.workspaceId);
  if (members.some((member) => member.user.email === normalizedEmail)) {
    throw new Error("This user is already a member of the workspace.");
  }

  const rawToken = createRawToken();
  const invitation: WorkspaceInvitationRecord = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    email: normalizedEmail,
    role: input.role,
    tokenHash: hashToken(rawToken),
    invitedByUserId: input.actor.user.id,
    expiresAt: createExpiry(72),
    acceptedAt: null,
    createdAt: new Date().toISOString()
  };

  await createWorkspaceInvitation(invitation);

  const invitePath = `/invite/${rawToken}`;
  const delivery = await sendPreviewAwareEmail({
    to: normalizedEmail,
    subject: `${input.actor.workspace.name} invited you to FoundryOS`,
    text:
      `${input.actor.user.fullName} invited you to join ${input.actor.workspace.name} ` +
      `as ${input.role}.\n\nAccept the invite:\n${buildAbsoluteUrl(invitePath)}`,
    previewPath: invitePath
  });

  return {
    invitation,
    previewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered
  };
}

export async function acceptWorkspaceInvite(rawToken: string, user: AppUser) {
  const invitation = await findInvitationByTokenHash(hashToken(rawToken));

  if (!invitation) {
    throw new Error("This invitation is invalid or expired.");
  }

  if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
    throw new Error("This invitation belongs to a different email address.");
  }

  const existingMembership = await findWorkspaceMembership(
    invitation.workspaceId,
    user.id
  );
  if (existingMembership) {
    if (!invitation.acceptedAt) {
      await acceptWorkspaceInvitation(invitation.id, new Date().toISOString());
    }
    await syncSeatUsage(invitation.workspaceId);
    return invitation.workspaceId;
  }

  if (invitation.acceptedAt) {
    throw new Error("This invitation has already been accepted.");
  }

  const now = new Date().toISOString();
  await createWorkspaceMembership({
    id: crypto.randomUUID(),
    workspaceId: invitation.workspaceId,
    userId: user.id,
    role: invitation.role,
    createdAt: now,
    updatedAt: now
  });

  await acceptWorkspaceInvitation(invitation.id, now);
  await syncSeatUsage(invitation.workspaceId);

  return invitation.workspaceId;
}

export async function bootstrapInternalAdminFromToken(token: string, response: NextResponse) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const providedToken = token.trim();

  if (!expected || providedToken !== expected.trim()) {
    throw new Error("Invalid admin access token.");
  }

  let user = await findUserByEmail(INTERNAL_ADMIN_BOOTSTRAP_EMAIL);
  const now = new Date().toISOString();

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email: INTERNAL_ADMIN_BOOTSTRAP_EMAIL,
      fullName: "Preview Internal Admin",
      passwordHash: hashPassword(createRawToken(18)),
      emailVerifiedAt: now,
      globalRole: "internal_admin",
      createdAt: now,
      updatedAt: now
    };
    await createUser(user);
  } else if (user.globalRole !== "internal_admin") {
    user = (await updateUser(user.id, {
      globalRole: "internal_admin",
      emailVerifiedAt: user.emailVerifiedAt ?? now
    })) as AppUser;
  }

  await startSessionForUser(user.id, response);
}

export async function logoutCurrentSession(response: NextResponse) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    try {
      await deleteSessionByTokenHash(hashToken(rawToken));
    } catch (error) {
      if (!isConfigurationError(error)) {
        throw error;
      }
    }
  }

  clearSessionCookie(response);
}

export function redirectAfterAuth(target?: string | null) {
  return sanitizeRedirectPath(target);
}

export async function logWorkspaceAdminChange(input: {
  adminUserId: string;
  workspaceId: string;
  previousPlan: WorkspaceRecord["plan"];
  nextPlan: WorkspaceRecord["plan"];
  previousAccountState: WorkspaceRecord["accountState"];
  nextAccountState: WorkspaceRecord["accountState"];
}) {
  const audit: AdminAuditLogRecord = {
    id: crypto.randomUUID(),
    adminUserId: input.adminUserId,
    workspaceId: input.workspaceId,
    action: "workspace.state.updated",
    previousPlan: input.previousPlan,
    nextPlan: input.nextPlan,
    previousAccountState: input.previousAccountState,
    nextAccountState: input.nextAccountState,
    metadata: null,
    createdAt: new Date().toISOString()
  };

  await createAdminAuditLog(audit);
}

export function isAuthInfrastructureError(error: unknown) {
  return isConfigurationError(error);
}
