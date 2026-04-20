import { TeamInviteForm } from "@/components/team-invite-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canManageWorkspace,
  formatRoleLabel,
  getPlanDefinition,
  isLockedState
} from "@/lib/foundation";
import { listWorkspaceInvitations, listWorkspaceMembers } from "@/db/foundation";
import { copyForLanguage, formatDateTimeForLanguage } from "@/lib/language";

export default async function TeamPage() {
  const context = await requireWorkspaceContext("/app/team");
  const language = context.workspace.outputLanguage;
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
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">{copyForLanguage(language, "Team", "Equipo")}</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {copyForLanguage(
            language,
            "Workspace members and invitation flow",
            "Miembros del espacio y flujo de invitaciones"
          )}
        </h2>
        <p className="mt-4 body-lg">
          {copyForLanguage(
            language,
            "Owners and admins can invite members by email. In pilot mode, invite links are surfaced directly when outbound email is not configured.",
            "Los propietarios y administradores pueden invitar miembros por correo. En modo piloto, los enlaces de invitación aparecen directamente cuando el correo saliente no está configurado."
          )}
        </p>
      </section>

      <TeamInviteForm canInvite={canInvite} language={language} />

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          {copyForLanguage(language, "Members", "Miembros")}
        </p>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Name", "Nombre")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Email", "Correo")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Workspace role", "Rol en el espacio")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Verified", "Verificada")}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membership.id} className="border-t border-[color:var(--border)]">
                  <td className="px-4 py-4 font-semibold">{member.user.fullName}</td>
                  <td className="px-4 py-4 text-muted">{member.user.email}</td>
                  <td className="px-4 py-4 capitalize">
                    {formatRoleLabel(member.membership.role, language)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {member.user.emailVerifiedAt
                      ? copyForLanguage(language, "verified", "verificada")
                      : copyForLanguage(language, "pending", "pendiente")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          {copyForLanguage(language, "Pending invites", "Invitaciones pendientes")}
        </p>
        <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Email", "Correo")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Role", "Rol")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Status", "Estado")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Expires", "Caduca")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invitations.length > 0 ? (
                invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-t border-[color:var(--border)]">
                    <td className="px-4 py-4 text-muted">{invitation.email}</td>
                    <td className="px-4 py-4 capitalize">
                      {formatRoleLabel(invitation.role, language)}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {invitation.acceptedAt
                        ? copyForLanguage(language, "accepted", "aceptada")
                        : copyForLanguage(language, "pending", "pendiente")}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatDateTimeForLanguage(language, invitation.expiresAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={4}>
                    {copyForLanguage(language, "No invitations yet.", "Todavía no hay invitaciones.")}
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
