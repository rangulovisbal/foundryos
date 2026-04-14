import type {
  AppSession,
  AppUser,
  EmailVerificationRecord,
  PasswordResetRecord,
  UsageCounterRecord,
  WorkspaceInvitationRecord,
  WorkspaceMembershipRecord,
  WorkspaceRecord
} from "@/lib/foundation";
import { readJsonArray, resolveDataFile, writeJsonArray } from "@/lib/local-json";

const USERS_PATH = resolveDataFile("auth-users.json");
const SESSIONS_PATH = resolveDataFile("auth-sessions.json");
const WORKSPACES_PATH = resolveDataFile("workspaces.json");
const MEMBERSHIPS_PATH = resolveDataFile("workspace-memberships.json");
const INVITATIONS_PATH = resolveDataFile("workspace-invitations.json");
const VERIFICATIONS_PATH = resolveDataFile("email-verifications.json");
const PASSWORD_RESETS_PATH = resolveDataFile("password-resets.json");
const USAGE_PATH = resolveDataFile("workspace-usage.json");

export async function readLocalUsers() {
  return readJsonArray<AppUser>(USERS_PATH);
}

export async function writeLocalUsers(users: AppUser[]) {
  await writeJsonArray(USERS_PATH, users);
}

export async function readLocalSessions() {
  return readJsonArray<AppSession>(SESSIONS_PATH);
}

export async function writeLocalSessions(sessions: AppSession[]) {
  await writeJsonArray(SESSIONS_PATH, sessions);
}

export async function readLocalWorkspaces() {
  return readJsonArray<WorkspaceRecord>(WORKSPACES_PATH);
}

export async function writeLocalWorkspaces(workspaces: WorkspaceRecord[]) {
  await writeJsonArray(WORKSPACES_PATH, workspaces);
}

export async function readLocalMemberships() {
  return readJsonArray<WorkspaceMembershipRecord>(MEMBERSHIPS_PATH);
}

export async function writeLocalMemberships(
  memberships: WorkspaceMembershipRecord[]
) {
  await writeJsonArray(MEMBERSHIPS_PATH, memberships);
}

export async function readLocalInvitations() {
  return readJsonArray<WorkspaceInvitationRecord>(INVITATIONS_PATH);
}

export async function writeLocalInvitations(
  invitations: WorkspaceInvitationRecord[]
) {
  await writeJsonArray(INVITATIONS_PATH, invitations);
}

export async function readLocalEmailVerifications() {
  return readJsonArray<EmailVerificationRecord>(VERIFICATIONS_PATH);
}

export async function writeLocalEmailVerifications(
  tokens: EmailVerificationRecord[]
) {
  await writeJsonArray(VERIFICATIONS_PATH, tokens);
}

export async function readLocalPasswordResets() {
  return readJsonArray<PasswordResetRecord>(PASSWORD_RESETS_PATH);
}

export async function writeLocalPasswordResets(tokens: PasswordResetRecord[]) {
  await writeJsonArray(PASSWORD_RESETS_PATH, tokens);
}

export async function readLocalUsageCounters() {
  return readJsonArray<UsageCounterRecord>(USAGE_PATH);
}

export async function writeLocalUsageCounters(counters: UsageCounterRecord[]) {
  await writeJsonArray(USAGE_PATH, counters);
}
