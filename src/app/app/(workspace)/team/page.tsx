import { TeamInviteForm } from "@/components/team-invite-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canManageWorkspace,
  getPlanDefinition,
  isLockedState
} from "@/lib/foundation";
import { listWorkspaceInvitations, listWorkspaceMembers } from "@/db/foundation";

export default async function TeamPage() {
  const context = await requireWorkspaceContext("/app/team");
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(context.workspace.id),
    listWorkspaceInvitations(context.workspace.id)
  ]);

  const canInvite =
    getPlanDefinition(context.workspace.plan).features.team &&
    canManageWorkspace(context.membership.role, context.workspace.accountState);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Team</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Workspace members and invitation flow
        </h2>
        <p className="mt-4 body-lg">
          Owners and admins can invite members by email. In preview mode, invite
          links are surfaced directly when outbound email is not configured.
        </p>
      </section>

      <TeamInviteForm canInvite={canInvite} />

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Members</p>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Workspace role</th>
                <th className="px-4 py-3 font-semibold">Verified</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membership.id} className="border-t border-[color:var(--border)]">
                  <td className="px-4 py-4 font-semibold">{member.user.fullName}</td>
                  <td className="px-4 py-4 text-muted">{member.user.email}</td>
                  <td className="px-4 py-4 capitalize">
                    {member.membership.role.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {member.user.emailVerifiedAt ? "verified" : "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Pending invites</p>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-t border-[color:var(--border)]">
                    <td className="px-4 py-4 text-muted">{invitation.email}</td>
                    <td className="px-4 py-4 capitalize">{invitation.role}</td>
                    <td className="px-4 py-4 text-muted">
                      {invitation.acceptedAt ? "accepted" : "pending"}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {new Date(invitation.expiresAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={4}>
                    No invitations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
