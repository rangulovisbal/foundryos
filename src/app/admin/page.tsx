import { ConfigurationRequiredPanel } from "@/components/configuration-required-panel";
import { AdminWorkspaceControls } from "@/components/admin-workspace-controls";
import { requireInternalAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { isConfigurationError } from "@/lib/errors";
import { formatRoleLabel } from "@/lib/foundation";
import { listAdminAuditLogs, listUsers, listWorkspaces } from "@/db/foundation";

type AdminLoadResult<T> = {
  data: T;
  status: "ok" | "timed-out" | "failed";
};

function loadAdminDataset<T>(
  loader: Promise<T>,
  fallback: T,
  timeoutMs = 8000
): Promise<AdminLoadResult<T>> {
  const tracked = loader
    .then((data) => ({ data, status: "ok" as const }))
    .catch(() => ({ data: fallback, status: "failed" as const }));

  const timeout = new Promise<AdminLoadResult<T>>((resolve) => {
    setTimeout(() => resolve({ data: fallback, status: "timed-out" }), timeoutMs);
  });

  return Promise.race([tracked, timeout]);
}

export default async function AdminPage() {
  try {
    const currentUser = await requireInternalAdmin();
    const [usersResult, workspacesResult, auditLogsResult] = await Promise.all([
      loadAdminDataset(listUsers(), []),
      loadAdminDataset(listWorkspaces(), []),
      loadAdminDataset(listAdminAuditLogs(), [])
    ]);
    const users = usersResult.data;
    const workspaces = workspacesResult.data;
    const auditLogs = auditLogsResult.data;
    const degradedSections = [
      usersResult.status !== "ok" ? "users" : null,
      workspacesResult.status !== "ok" ? "workspaces" : null,
      auditLogsResult.status !== "ok" ? "audit log" : null
    ].filter(Boolean);

    const usersById = new Map(users.map((user) => [user.id, user]));

    return (
      <div className="page-shell space-y-8 pt-0">
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">Internal admin</span>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
            Preview workspace control plane.
          </h1>
          <p className="mt-4 body-lg">
            This panel exists for MVP operations only. It controls workspace plan
            and account state for testing while live billing, automated
            provisioning, and external admin tooling remain intentionally offline.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span>
              Signed in as <strong className="text-ink">{currentUser.fullName}</strong>
            </span>
            <span>·</span>
            <span>{currentUser.email}</span>
          </div>
          {degradedSections.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              Some admin data is temporarily delayed from the database:{" "}
              {degradedSections.join(", ")}. The page is still usable; refresh in
              a moment if a table looks empty.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="Users" value={String(users.length)} />
          <StatusCard label="Workspaces" value={String(workspaces.length)} />
          <StatusCard
            label="Foundation DB"
            value={
              env.foundationDbMode === "remote"
                ? "Configured"
                : env.foundationDbMode === "embedded"
                  ? "Embedded dev database"
                  : "Missing DATABASE_URL"
            }
          />
          <StatusCard
            label="Billing"
            value={env.hasStripe ? "Configured but disabled" : "Disabled"}
          />
        </section>

        <section className="surface p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted">
                Workspaces
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
                Manual account-state controls
              </h2>
            </div>
            <form action="/api/admin/logout" method="post">
              <button
                className="rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>

          <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-white/75 px-4 py-3 text-sm text-muted">
            Changes here are preview-only operational controls. They are not tied
            to live Stripe state, invoicing, or automated dunning.
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Account state</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Controls</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const owner = usersById.get(workspace.ownerUserId);

                    return (
                      <tr
                        key={workspace.id}
                        className="border-t border-[color:var(--border)] align-top"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold">{workspace.name}</p>
                          <p className="text-muted">{workspace.slug}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">
                            {owner?.fullName ?? "Unknown owner"}
                          </p>
                          <p className="text-muted">
                            {owner?.email ?? workspace.ownerUserId}
                          </p>
                        </td>
                        <td className="px-4 py-4 capitalize">
                          {workspace.plan.replaceAll("-", " ")}
                        </td>
                        <td className="px-4 py-4 capitalize">
                          {workspace.accountState.replaceAll("_", " ")}
                        </td>
                        <td className="px-4 py-4 text-muted">
                          {new Date(workspace.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <AdminWorkspaceControls
                            initialPlan={workspace.plan}
                            initialState={workspace.accountState}
                            workspaceId={workspace.id}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={6}>
                      No workspaces provisioned yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Users</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Authenticated preview users
          </h2>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Global role</th>
                  <th className="px-4 py-3 font-semibold">Email verification</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-muted">{user.email}</p>
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {formatRoleLabel(user.globalRole)}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {user.emailVerifiedAt
                          ? new Date(user.emailVerifiedAt).toLocaleString()
                          : "pending"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={4}>
                      No users created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Audit trail
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Recent admin state changes
          </h2>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Account state</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((entry) => (
                    <tr
                      key={entry.log.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.adminUser.fullName}</p>
                        <p className="text-muted">{entry.adminUser.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.log.previousPlan ?? "n/a"} → {entry.log.nextPlan ?? "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.log.previousAccountState ?? "n/a"} →{" "}
                        {entry.log.nextAccountState ?? "n/a"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={5}>
                      No admin state changes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (isConfigurationError(error)) {
      return (
        <div className="page-shell pt-0">
          <ConfigurationRequiredPanel
            body="Internal admin tools now depend on the production database. Configure DATABASE_URL before using /admin."
            title="Internal admin access is unavailable"
          />
        </div>
      );
    }

    throw error;
  }
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}
