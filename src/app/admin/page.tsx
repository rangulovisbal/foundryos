import { ConfigurationRequiredPanel } from "@/components/configuration-required-panel";
import { AdminRequestStatusControls } from "@/components/admin-request-status-controls";
import { AdminWorkspaceControls } from "@/components/admin-workspace-controls";
import { requireInternalAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { isConfigurationError } from "@/lib/errors";
import {
  deletionRequestStatusOptions,
  formatDeletionRequestStatus,
  formatDeletionRequestType,
  formatRoleLabel,
  formatSupportIssueType,
  formatSupportRequestStatus,
  supportRequestStatusOptions
} from "@/lib/foundation";
import {
  getAdminOverviewMetrics,
  listAdminAuditLogs,
  listAdminAssetJobs,
  listAdminDeletionRequests,
  listAdminDiagnosticJobs,
  listAdminPlanningJobs,
  listAdminSopJobs,
  listAdminSupportRequests,
  listUsers,
  listWorkspaces
} from "@/db/foundation";

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
    const [
      overviewMetricsResult,
      usersResult,
      workspacesResult,
      auditLogsResult,
      diagnosticJobsResult,
      planningJobsResult,
      assetJobsResult,
      sopJobsResult,
      supportRequestsResult,
      deletionRequestsResult
    ] = await Promise.all([
      loadAdminDataset(getAdminOverviewMetrics(), {
        allAccounts: 0,
        workspaceMembers: 0,
        pendingInvites: 0,
        internalAdmins: 0
      }),
      loadAdminDataset(listUsers(), []),
      loadAdminDataset(listWorkspaces(), []),
      loadAdminDataset(listAdminAuditLogs(), []),
      loadAdminDataset(listAdminDiagnosticJobs(), []),
      loadAdminDataset(listAdminPlanningJobs(), []),
      loadAdminDataset(listAdminAssetJobs(), []),
      loadAdminDataset(listAdminSopJobs(), []),
      loadAdminDataset(listAdminSupportRequests(), []),
      loadAdminDataset(listAdminDeletionRequests(), [])
    ]);
    const users = usersResult.data;
    const overviewMetrics = overviewMetricsResult.data;
    const workspaces = workspacesResult.data;
    const auditLogs = auditLogsResult.data;
    const diagnosticJobs = diagnosticJobsResult.data;
    const planningJobs = planningJobsResult.data;
    const assetJobs = assetJobsResult.data;
    const sopJobs = sopJobsResult.data;
    const supportRequests = supportRequestsResult.data;
    const deletionRequests = deletionRequestsResult.data;
    const degradedSections = [
      overviewMetricsResult.status !== "ok" ? "overview metrics" : null,
      usersResult.status !== "ok" ? "users" : null,
      workspacesResult.status !== "ok" ? "workspaces" : null,
      auditLogsResult.status !== "ok" ? "audit log" : null,
      diagnosticJobsResult.status !== "ok" ? "diagnostic jobs" : null,
      planningJobsResult.status !== "ok" ? "planning jobs" : null,
      assetJobsResult.status !== "ok" ? "asset jobs" : null,
      sopJobsResult.status !== "ok" ? "SOP jobs" : null,
      supportRequestsResult.status !== "ok" ? "support requests" : null,
      deletionRequestsResult.status !== "ok" ? "deletion requests" : null
    ].filter(Boolean);

    const usersById = new Map(users.map((user) => [user.id, user]));
    const latestRoadmapJob = planningJobs.find(
      (entry) => entry.job.jobType === "roadmap_generation"
    );
    const latestThirtyDayPlanJob = planningJobs.find(
      (entry) => entry.job.jobType === "thirty_day_plan_generation"
    );

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

        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Account overview
            </p>
            <p className="text-sm text-muted">
              Counts reflect the whole preview environment across app accounts,
              accepted workspace memberships, open invites, and internal admin access.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatusCard
              detail="Every saved account in the auth database."
              label="All accounts"
              value={String(overviewMetrics.allAccounts)}
            />
            <StatusCard
              detail="Accepted memberships across all workspaces."
              label="Workspace members"
              value={String(overviewMetrics.workspaceMembers)}
            />
            <StatusCard
              detail="Open invitations that have not been accepted or expired."
              label="Pending invites"
              value={String(overviewMetrics.pendingInvites)}
            />
            <StatusCard
              detail="Accounts with internal admin access."
              label="Internal admins"
              value={String(overviewMetrics.internalAdmins)}
            />
            <StatusCard
              detail="Saved workspaces in the preview environment."
              label="Workspaces"
              value={String(workspaces.length)}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatusCard label="Diagnostic jobs" value={String(diagnosticJobs.length)} />
          <StatusCard
            label="Roadmap jobs"
            value={latestRoadmapJob?.job.status ?? "none"}
          />
          <StatusCard
            label="30-day plan jobs"
            value={latestThirtyDayPlanJob?.job.status ?? "none"}
          />
          <StatusCard label="Asset jobs" value={assetJobs[0]?.job.status ?? "none"} />
          <StatusCard label="SOP jobs" value={sopJobs[0]?.job.status ?? "none"} />
          <StatusCard label="Support requests" value={String(supportRequests.length)} />
          <StatusCard label="Deletion requests" value={String(deletionRequests.length)} />
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
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Diagnostics
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Recent diagnostic job state
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This is lightweight internal visibility only. It confirms job state,
            latest score, and workspace ownership while diagnostics remain in
            preview mode.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticJobs.length > 0 ? (
                  diagnosticJobs.map((entry) => (
                    <tr
                      key={entry.job.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {entry.requestedByUser?.fullName ?? "Unknown"}
                        </p>
                        <p className="text-muted">
                          {entry.requestedByUser?.email ?? "n/a"}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">
                        {entry.result
                          ? `${entry.result.overallMaturityScore}/100`
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {entry.result?.confidence ?? "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={6}>
                      No diagnostic jobs have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Roadmap and planning
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Recent roadmap and 30-day plan job state
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This view confirms whether roadmap generation, action generation,
            and 30-day plan generation completed or failed. Outputs remain
            preview planning artifacts and are not connected to live billing.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Roadmap</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                  <th className="px-4 py-3 font-semibold">30-day plan</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {planningJobs.length > 0 ? (
                  planningJobs.map((entry) => (
                    <tr
                      key={entry.job.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {entry.requestedByUser?.fullName ?? "Unknown"}
                        </p>
                        <p className="text-muted">
                          {entry.requestedByUser?.email ?? "n/a"}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {entry.job.jobType.replaceAll("_", " ")}
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">{entry.roadmap ? "saved" : "n/a"}</td>
                      <td className="px-4 py-4">{entry.actionPlan ? "saved" : "n/a"}</td>
                      <td className="px-4 py-4">
                        {entry.thirtyDayPlan ? "saved" : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={9}>
                      No planning jobs have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Assets
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Recent asset generation state
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This view confirms whether asset generation completed or failed and
            whether the latest structured artifacts are available. Export and
            live billing workflows remain intentionally offline.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assets</th>
                  <th className="px-4 py-3 font-semibold">Types</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {assetJobs.length > 0 ? (
                  assetJobs.map((entry) => (
                    <tr
                      key={entry.job.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {entry.requestedByUser?.fullName ?? "Unknown"}
                        </p>
                        <p className="text-muted">
                          {entry.requestedByUser?.email ?? "n/a"}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">{entry.assets.length}</td>
                      <td className="px-4 py-4 text-muted">
                        {entry.assets.length > 0
                          ? entry.assets
                              .map((asset) => asset.assetType.replaceAll("_", " "))
                              .join(", ")
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={7}>
                      No asset generation jobs have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            SOPs
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Recent SOP generation state
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This view confirms whether SOP generation completed or failed and
            whether the latest structured procedures are available. Export and
            live integrations remain intentionally offline.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requested by</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">SOPs</th>
                  <th className="px-4 py-3 font-semibold">Types</th>
                  <th className="px-4 py-3 font-semibold">Error</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {sopJobs.length > 0 ? (
                  sopJobs.map((entry) => (
                    <tr
                      key={entry.job.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {entry.requestedByUser?.fullName ?? "Unknown"}
                        </p>
                        <p className="text-muted">
                          {entry.requestedByUser?.email ?? "n/a"}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                      <td className="px-4 py-4">{entry.artifacts.length}</td>
                      <td className="px-4 py-4 text-muted">
                        {entry.artifacts.length > 0
                          ? entry.artifacts
                              .map((a) => a.sopType.replaceAll("_", " "))
                              .join(", ")
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={7}>
                      No SOP generation jobs have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Support requests
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Pilot support intake visibility
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            These are the minimal in-product support requests created from the
            authenticated workspace support route. Status and internal notes are
            managed manually here during pilot operations.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Issue</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reviewed by</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Controls</th>
                </tr>
              </thead>
              <tbody>
                {supportRequests.length > 0 ? (
                  supportRequests.map((entry) => (
                    <tr
                      key={entry.request.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.requestedByUser.fullName}</p>
                        <p className="text-muted">{entry.requestedByUser.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {formatSupportIssueType(entry.request.issueType)}
                        </p>
                        <p className="mt-2 max-w-[42ch] text-muted">
                          {entry.request.message}
                        </p>
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {formatSupportRequestStatus(entry.request.status)}
                      </td>
                      <td className="px-4 py-4">
                        {entry.reviewedByUser ? (
                          <>
                            <p className="font-semibold">{entry.reviewedByUser.fullName}</p>
                            <p className="text-muted">{entry.reviewedByUser.email}</p>
                          </>
                        ) : (
                          <span className="text-muted">n/a</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.request.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <AdminRequestStatusControls
                          endpoint={`/api/admin/support-requests/${entry.request.id}`}
                          initialNotes={entry.request.adminNotes}
                          initialStatus={entry.request.status}
                          statusOptions={supportRequestStatusOptions}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={7}>
                      No support requests have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Deletion requests
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Account and workspace deletion review queue
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            These requests are request-only in the MVP. No account or workspace
            is deleted automatically from the user-facing surface.
          </p>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
            <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Reviewed by</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Controls</th>
                </tr>
              </thead>
              <tbody>
                {deletionRequests.length > 0 ? (
                  deletionRequests.map((entry) => (
                    <tr
                      key={entry.request.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">{entry.workspace.slug}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.requestedByUser.fullName}</p>
                        <p className="text-muted">{entry.requestedByUser.email}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {formatDeletionRequestType(entry.request.requestType)}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {formatDeletionRequestStatus(entry.request.status)}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.request.reason ?? "No reason added."}
                      </td>
                      <td className="px-4 py-4">
                        {entry.reviewedByUser ? (
                          <>
                            <p className="font-semibold">{entry.reviewedByUser.fullName}</p>
                            <p className="text-muted">{entry.reviewedByUser.email}</p>
                          </>
                        ) : (
                          <span className="text-muted">n/a</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {new Date(entry.request.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <AdminRequestStatusControls
                          endpoint={`/api/admin/deletion-requests/${entry.request.id}`}
                          initialNotes={entry.request.adminNotes}
                          initialStatus={entry.request.status}
                          statusOptions={deletionRequestStatusOptions}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-muted" colSpan={8}>
                      No deletion requests have been created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

function StatusCard({
  detail,
  label,
  value
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
    </article>
  );
}
