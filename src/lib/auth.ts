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
  findWorkspaceById,
  findWorkspaceBySlug,
  findWorkspaceMembership,
  findSessionByTokenHash,
  findUserByEmail,
  findUserById,
  listUserWorkspaceMemberships,
  listWorkspaceMembers,
  listWorkspaceUsage,
  syncSeatUsage,
  updateUser
} from "@/db/foundation";
import { env } from "@/lib/env";
import { ConfigurationError, isConfigurationError } from "@/lib/errors";
import {
  type AdminAuditLogRecord,
  type AppUser,
  type OutputLanguage,
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
import { copyForLanguage, DEFAULT_LANGUAGE, normalizeLanguage } from "@/lib/language";
import { sendTransactionalEmail } from "@/lib/email";
import {
  createRawToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifySecret
} from "@/lib/security";

const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-foundry_session"
    : "foundry_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const INTERNAL_ADMIN_BOOTSTRAP_EMAIL = "internal-admin@preview.foundryos.local";
export type AuthDeliveryMode = "email" | "preview_link" | "unavailable";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createExpiry(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

function appendSearchParams(
  path: string,
  params: Record<string, string | null | undefined>
) {
  const url = new URL(path, env.appUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}`;
}

function resolveAppUrl(appUrl?: string | null) {
  if (env.isProduction) {
    return resolveProductionAppUrl();
  }

  if (!appUrl) {
    return env.appUrl;
  }

  try {
    return new URL(appUrl).origin;
  } catch {
    return env.appUrl;
  }
}

function resolveProductionAppUrl() {
  if (!env.hasConfiguredAppUrl) {
    throw new ConfigurationError(
      "Canonical app URL is not configured.",
      "canonical_app_url_missing"
    );
  }

  let url: URL;

  try {
    url = new URL(env.appUrl);
  } catch {
    throw new ConfigurationError(
      "Canonical app URL is invalid.",
      "canonical_app_url_invalid"
    );
  }

  const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
  if (url.protocol !== "https:" || localHostnames.has(url.hostname)) {
    throw new ConfigurationError(
      "Canonical app URL must be a production HTTPS origin.",
      "canonical_app_url_unsafe"
    );
  }

  return url.origin;
}

export function getRequestAppUrl(request: Request) {
  if (env.isProduction) {
    return resolveProductionAppUrl();
  }

  const origin = request.headers.get("origin");

  if (origin) {
    return resolveAppUrl(origin);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol = forwardedProto ?? new URL(request.url).protocol.replace(/:$/, "");
    return `${protocol}://${host}`;
  }

  return resolveAppUrl(new URL(request.url).origin);
}

function buildAbsoluteUrl(path: string, appUrl?: string | null) {
  return `${resolveAppUrl(appUrl)}${path}`;
}

export function getAuthDeliveryMode(): AuthDeliveryMode {
  if (env.hasResend) {
    return "email";
  }

  if (env.authPreviewLinksBlocked) {
    return "unavailable";
  }

  if (env.allowAuthPreviewLinks) {
    return "preview_link";
  }

  return "unavailable";
}

async function sendPreviewAwareEmail({
  appUrl,
  to,
  subject,
  text,
  previewPath
}: {
  appUrl?: string | null;
  to: string;
  subject: string;
  text: string;
  previewPath: string;
}) {
  const deliveryMode = getAuthDeliveryMode();
  const previewUrl = buildAbsoluteUrl(previewPath, appUrl);

  if (deliveryMode === "email") {
    const delivery = await sendTransactionalEmail({ to, subject, text });

    if (delivery.delivered) {
      return { ...delivery, previewUrl: null, deliveryMode: "email" as const };
    }
  }

  if (deliveryMode === "preview_link") {
    return {
      delivered: false,
      reason: "preview-link-enabled" as const,
      previewUrl,
      deliveryMode: "preview_link" as const
    };
  }

  return {
    delivered: false,
    reason: "auth-delivery-unavailable" as const,
    previewUrl: null,
    deliveryMode: "unavailable" as const
  };
}

function resolveGlobalRole(email: string): AppUser["globalRole"] {
  return getInternalAdminEmails().includes(normalizeEmail(email))
    ? "internal_admin"
    : "user";
}

export async function resolvePrimaryLanguageForUser(
  user: AppUser
): Promise<OutputLanguage> {
  if (user.preferredLanguage) {
    return user.preferredLanguage;
  }

  const memberships = await listUserWorkspaceMemberships(user.id);
  const language = memberships[0]?.workspace.outputLanguage ?? DEFAULT_LANGUAGE;

  if (user.preferredLanguage !== language) {
    await updateUser(user.id, {
      preferredLanguage: language
    });
  }

  return language;
}

export async function getPostAuthRedirectPath(
  userId: string,
  requestedPath?: string | null
) {
  const sanitizedPath = sanitizeRedirectPath(requestedPath);
  const user = await findUserById(userId);

  if (user?.globalRole === "internal_admin") {
    if (sanitizedPath.startsWith("/admin")) {
      return sanitizedPath;
    }

    if (
      !requestedPath ||
      ["/app", "/app/setup", "/app/dashboard"].includes(sanitizedPath)
    ) {
      return "/admin";
    }
  }

  const memberships = await listUserWorkspaceMemberships(userId);
  if (memberships.length === 0) {
    return user?.globalRole === "internal_admin" ? "/admin" : "/app/setup";
  }

  return sanitizedPath === "/app" ? "/app/dashboard" : sanitizedPath;
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
    redirect(
      `/login?redirectTo=${encodeURIComponent(sanitizeRedirectPath(redirectTo ?? "/app"))}`
    );
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
  appUrl?: string | null;
  fullName: string;
  email: string;
  password: string;
  language: OutputLanguage;
  redirectTo?: string | null;
}) {
  const language = normalizeLanguage(input.language);
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new Error(
      copyForLanguage(
        language,
        "An account already exists for this email.",
        "Ya existe una cuenta con este correo."
      )
    );
  }

  const now = new Date().toISOString();
  const user: AppUser = {
    id: crypto.randomUUID(),
    email,
    fullName: input.fullName.trim(),
    passwordHash: hashPassword(input.password),
    emailVerifiedAt: null,
    preferredLanguage: language,
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

  const verificationPath = appendSearchParams("/api/auth/verify-email", {
    token: rawToken,
    redirectTo: sanitizeRedirectPath(input.redirectTo)
  });
  const delivery = await sendPreviewAwareEmail({
    appUrl: input.appUrl,
    to: user.email,
    subject: copyForLanguage(
      language,
      "Verify your FoundryOS account",
      "Verifica tu cuenta de FoundryOS"
    ),
    text:
      copyForLanguage(language, `Hi ${user.fullName},`, `Hola ${user.fullName},`) +
      "\n\n" +
      copyForLanguage(
        language,
        "Verify your account to access FoundryOS:",
        "Verifica tu cuenta para acceder a FoundryOS:"
      ) +
      `\n${buildAbsoluteUrl(verificationPath, input.appUrl)}\n\n` +
      copyForLanguage(
        language,
        "If you did not request this account, you can ignore this email.",
        "Si no solicitaste esta cuenta, puedes ignorar este correo."
      ),
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

  const updatedUser = await updateUser(verification.userId, {
    emailVerifiedAt: new Date().toISOString()
  });

  await startSessionForUser(verification.userId, response);

  return updatedUser ?? (await findUserById(verification.userId));
}

export async function authenticateUser(input: {
  appUrl?: string | null;
  email: string;
  password: string;
  redirectTo?: string | null;
}) {
  const email = normalizeEmail(input.email);
  let user = await findUserByEmail(email);
  const language = user?.preferredLanguage ?? DEFAULT_LANGUAGE;

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error(
      copyForLanguage(
        language,
        "Invalid email or password.",
        "Correo o contraseña no válidos."
      )
    );
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

    const verificationPath = appendSearchParams("/api/auth/verify-email", {
      token: rawToken,
      redirectTo: sanitizeRedirectPath(input.redirectTo)
    });
    const delivery = await sendPreviewAwareEmail({
      appUrl: input.appUrl,
      to: user.email,
      subject: copyForLanguage(
        language,
        "Verify your FoundryOS account",
        "Verifica tu cuenta de FoundryOS"
      ),
      text:
        copyForLanguage(language, `Hi ${user.fullName},`, `Hola ${user.fullName},`) +
        "\n\n" +
        copyForLanguage(
          language,
          "Verify your account to access FoundryOS:",
          "Verifica tu cuenta para acceder a FoundryOS:"
        ) +
        `\n${buildAbsoluteUrl(verificationPath, input.appUrl)}\n\n` +
        copyForLanguage(
          language,
          "If you did not request this account, you can ignore this email.",
          "Si no solicitaste esta cuenta, puedes ignorar este correo."
        ),
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

export async function requestPasswordReset(email: string, appUrl?: string | null) {
  const user = await findUserByEmail(normalizeEmail(email));
  const deliveryMode = getAuthDeliveryMode();

  if (!user) {
    return {
      requested: true,
      previewUrl: null,
      emailDelivery: deliveryMode === "email",
      deliveryMode
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

  const language = user.preferredLanguage ?? DEFAULT_LANGUAGE;
  const resetPath = appendSearchParams("/reset-password", {
    token: rawToken
  });
  const delivery = await sendPreviewAwareEmail({
    appUrl,
    to: user.email,
    subject: copyForLanguage(
      language,
      "Reset your FoundryOS password",
      "Restablece tu contraseña de FoundryOS"
    ),
    text:
      copyForLanguage(language, `Hi ${user.fullName},`, `Hola ${user.fullName},`) +
      "\n\n" +
      copyForLanguage(
        language,
        "Use the link below to reset your password:",
        "Usa el siguiente enlace para restablecer tu contraseña:"
      ) +
      `\n${buildAbsoluteUrl(resetPath, appUrl)}\n\n` +
      copyForLanguage(
        language,
        "If you did not request a reset, you can ignore this email.",
        "Si no solicitaste este cambio, puedes ignorar este correo."
      ),
    previewPath: resetPath
  });

  return {
    requested: true,
    previewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered,
    deliveryMode: delivery.deliveryMode
  };
}

export async function resendVerificationEmail(input: {
  appUrl?: string | null;
  email: string;
  redirectTo?: string | null;
  language?: OutputLanguage;
}) {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);
  const language = normalizeLanguage(input.language ?? user?.preferredLanguage ?? DEFAULT_LANGUAGE);

  if (!user || user.emailVerifiedAt) {
    return {
      requested: true,
      previewUrl: null,
      emailDelivery: getAuthDeliveryMode() === "email",
      deliveryMode: getAuthDeliveryMode()
    };
  }

  const rawToken = createRawToken();
  await createEmailVerification({
    id: crypto.randomUUID(),
    userId: user.id,
    email: user.email,
    tokenHash: hashToken(rawToken),
    expiresAt: createExpiry(24),
    createdAt: new Date().toISOString()
  });

  const verificationPath = appendSearchParams("/api/auth/verify-email", {
    token: rawToken,
    redirectTo: sanitizeRedirectPath(input.redirectTo)
  });
  const delivery = await sendPreviewAwareEmail({
    appUrl: input.appUrl,
    to: user.email,
    subject: copyForLanguage(
      language,
      "Verify your FoundryOS account",
      "Verifica tu cuenta de FoundryOS"
    ),
    text:
      copyForLanguage(language, `Hi ${user.fullName},`, `Hola ${user.fullName},`) +
      "\n\n" +
      copyForLanguage(
        language,
        "Verify your account to access FoundryOS:",
        "Verifica tu cuenta para acceder a FoundryOS:"
      ) +
      `\n${buildAbsoluteUrl(verificationPath, input.appUrl)}\n\n` +
      copyForLanguage(
        language,
        "If you did not request this account, you can ignore this email.",
        "Si no solicitaste esta cuenta, puedes ignorar este correo."
      ),
    previewPath: verificationPath
  });

  return {
    requested: true,
    previewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered,
    deliveryMode: delivery.deliveryMode
  };
}

export async function resetPasswordFromToken(
  token: string,
  password: string,
  language: OutputLanguage = DEFAULT_LANGUAGE
) {
  const reset = await consumePasswordReset(hashToken(token));

  if (!reset) {
    throw new Error(
      copyForLanguage(
        language,
        "This reset link is invalid or expired.",
        "Este enlace para restablecer la contraseña no es válido o ha caducado."
      )
    );
  }

  await updateUser(reset.userId, {
    passwordHash: hashPassword(password)
  });
  await deleteSessionsByUserId(reset.userId);
}

async function createUniqueWorkspaceSlug(name: string) {
  const base = slugifyWorkspaceName(name) || "workspace";
  let slug = base;
  let counter = 1;

  // Indexed lookups per candidate instead of loading every workspace row.
  while (await findWorkspaceBySlug(slug)) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

export async function createWorkspaceForUser(input: {
  user: AppUser;
  name: string;
  plan?: WorkspacePlan;
  language: OutputLanguage;
}) {
  const existing = await listUserWorkspaceMemberships(input.user.id);

  if (existing.length > 0) {
    throw new Error(
      copyForLanguage(
        input.language,
        "This preview currently supports one workspace per user.",
        "Esta versión piloto solo admite un espacio por usuario."
      )
    );
  }

  const parsed = workspaceCreationSchema.parse({
    name: input.name,
    plan: input.plan ?? "growth-os",
    language: input.language
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
    outputLanguage: parsed.language,
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

  await updateUser(input.user.id, {
    preferredLanguage: parsed.language
  });

  return workspace;
}

export async function inviteUserToWorkspace(input: {
  appUrl?: string | null;
  workspaceId: string;
  actor: WorkspaceContext;
  email: string;
  role: WorkspaceInvitationRecord["role"];
}) {
  const language = input.actor.workspace.outputLanguage;

  if (!canManageWorkspace(input.actor.membership.role, input.actor.workspace.accountState)) {
    throw new Error(
      copyForLanguage(
        language,
        "You do not have permission to invite members in this workspace.",
        "No tienes permisos para invitar miembros en este espacio."
      )
    );
  }

  if (!getPlanDefinition(input.actor.workspace.plan).features.team) {
    throw new Error(
      copyForLanguage(
        language,
        "Team invites are not available on this plan.",
        "Las invitaciones de equipo no están disponibles en este plan."
      )
    );
  }

  const normalizedEmail = normalizeEmail(input.email);
  const members = await listWorkspaceMembers(input.workspaceId);
  if (members.some((member) => member.user.email === normalizedEmail)) {
    throw new Error(
      copyForLanguage(
        language,
        "This user is already a member of the workspace.",
        "Esta persona ya forma parte del espacio."
      )
    );
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
    appUrl: input.appUrl,
    to: normalizedEmail,
    subject: copyForLanguage(
      input.actor.workspace.outputLanguage,
      `${input.actor.workspace.name} invited you to FoundryOS`,
      `${input.actor.workspace.name} te invitó a FoundryOS`
    ),
    text:
      copyForLanguage(
        input.actor.workspace.outputLanguage,
        `${input.actor.user.fullName} invited you to join ${input.actor.workspace.name} as ${input.role}.`,
        `${input.actor.user.fullName} te invitó a unirte a ${input.actor.workspace.name} como ${input.role}.`
      ) + `\n\n${copyForLanguage(
        input.actor.workspace.outputLanguage,
        "Accept the invite:",
        "Acepta la invitación:"
      )}\n${buildAbsoluteUrl(invitePath, input.appUrl)}`,
    previewPath: invitePath
  });

  return {
    invitation,
    previewUrl: delivery.previewUrl,
    emailDelivery: delivery.delivered
  };
}

export async function acceptWorkspaceInvite(rawToken: string, user: AppUser) {
  const language = user.preferredLanguage ?? DEFAULT_LANGUAGE;
  const invitation = await findInvitationByTokenHash(hashToken(rawToken));

  if (!invitation) {
    throw new Error(
      copyForLanguage(
        language,
        "This invitation is invalid or expired.",
        "Esta invitación no es válida o ha caducado."
      )
    );
  }

  if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
    throw new Error(
      copyForLanguage(
        language,
        "This invitation belongs to a different email address.",
        "Esta invitación pertenece a otra dirección de correo."
      )
    );
  }

  const workspace = await findWorkspaceById(invitation.workspaceId);
  if (!workspace) {
    throw new Error(
      copyForLanguage(
        language,
        "This workspace could not be found.",
        "No se pudo encontrar este espacio."
      )
    );
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
    if (user.preferredLanguage !== workspace.outputLanguage) {
      await updateUser(user.id, {
        preferredLanguage: workspace.outputLanguage
      });
    }
    return workspace;
  }

  if (invitation.acceptedAt) {
    throw new Error(
      copyForLanguage(
        language,
        "This invitation has already been accepted.",
        "Esta invitación ya fue aceptada."
      )
    );
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
  if (user.preferredLanguage !== workspace.outputLanguage) {
    await updateUser(user.id, {
      preferredLanguage: workspace.outputLanguage
    });
  }

  return workspace;
}

export async function bootstrapInternalAdminFromToken(token: string, response: NextResponse) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const providedToken = token.trim();
  const expectedToken = expected?.trim();

  if (!expectedToken || !verifySecret(providedToken, expectedToken)) {
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
      preferredLanguage: DEFAULT_LANGUAGE,
      globalRole: "internal_admin",
      createdAt: now,
      updatedAt: now
    };
    await createUser(user);
  } else if (user.globalRole !== "internal_admin") {
    user = (await updateUser(user.id, {
      globalRole: "internal_admin",
      emailVerifiedAt: user.emailVerifiedAt ?? now,
      preferredLanguage: user.preferredLanguage ?? DEFAULT_LANGUAGE
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
  workspaceId: string | null;
  previousPlan: WorkspaceRecord["plan"] | null;
  nextPlan: WorkspaceRecord["plan"] | null;
  previousAccountState: WorkspaceRecord["accountState"] | null;
  nextAccountState: WorkspaceRecord["accountState"] | null;
  action?: string;
  metadata?: Record<string, unknown> | null;
}) {
  const audit: AdminAuditLogRecord = {
    id: crypto.randomUUID(),
    adminUserId: input.adminUserId,
    workspaceId: input.workspaceId,
    action: input.action ?? "workspace.state.updated",
    previousPlan: input.previousPlan,
    nextPlan: input.nextPlan,
    previousAccountState: input.previousAccountState,
    nextAccountState: input.nextAccountState,
    metadata: input.metadata ?? null,
    createdAt: new Date().toISOString()
  };

  await createAdminAuditLog(audit);
}

export function isAuthInfrastructureError(error: unknown) {
  return isConfigurationError(error);
}
