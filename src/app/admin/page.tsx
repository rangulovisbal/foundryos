import { ConfigurationRequiredPanel } from "@/components/configuration-required-panel";
import { AdminRequestStatusControls } from "@/components/admin-request-status-controls";
import { AdminTabsShell } from "@/components/admin-tabs-shell";
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
  supportRequestStatusOptions,
  type AppUser,
  type WorkspaceRecord
} from "@/lib/foundation";
import {
  getAdminOverviewMetrics,
  listAdminAssetJobs,
  listAdminAuditLogs,
  listAdminDeletionRequests,
  listAdminDiagnosticJobs,
  listAdminOutputFeedback,
  listAdminPendingInvitations,
  listAdminPlanningJobs,
  listAdminSopJobs,
  listAdminSupportRequests,
  listAdminWorkspaceMembers,
  listUsers,
  listWorkspaces,
  type AdminAssetJobRow,
  type AdminAuditLogRow,
  type AdminDeletionRequestRow,
  type AdminDiagnosticJobRow,
  type AdminOverviewMetrics,
  type AdminOutputFeedbackRow,
  type AdminPendingInvitationRow,
  type AdminPlanningJobRow,
  type AdminSopJobRow,
  type AdminSupportRequestRow,
  type AdminWorkspaceMemberRow
} from "@/db/foundation";

type AdminLoadResult<T> = {
  data: T;
  status: "ok" | "timed-out" | "failed";
};

type RequestCounts = {
  total: number;
  open: number;
};

type FeedbackCounts = {
  total: number;
  useful: number;
  partial: number;
  generic: number;
};

type RecentJobIssue = {
  id: string;
  kind: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  error: string | null;
  createdAt: string;
  requestedByUser: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  detail: string;
};

type AdminWorkspaceViewRow = {
  workspace: WorkspaceRecord;
  owner: AppUser | undefined;
  supportCounts: RequestCounts;
  deletionCounts: RequestCounts;
  feedbackCounts: FeedbackCounts;
  latestFeedback: AdminOutputFeedbackRow | undefined;
  latestDiagnostic: AdminDiagnosticJobRow | undefined;
  latestRoadmap: AdminPlanningJobRow | undefined;
  latestThirtyDay: AdminPlanningJobRow | undefined;
  latestAsset: AdminAssetJobRow | undefined;
  latestSop: AdminSopJobRow | undefined;
  latestIssue: RecentJobIssue | undefined;
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

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatAdminDate(value: string) {
  return new Date(value).toLocaleString();
}

function buildRequestCountsByWorkspace<T extends { request: { workspaceId: string; status: string } }>(
  rows: T[],
  isOpen: (status: string) => boolean
) {
  const counts = new Map<string, RequestCounts>();

  for (const row of rows) {
    const current = counts.get(row.request.workspaceId) ?? { total: 0, open: 0 };
    current.total += 1;
    if (isOpen(row.request.status)) {
      current.open += 1;
    }
    counts.set(row.request.workspaceId, current);
  }

  return counts;
}

function buildFeedbackCountsByWorkspace(rows: AdminOutputFeedbackRow[]) {
  const counts = new Map<string, FeedbackCounts>();

  for (const row of rows) {
    const current = counts.get(row.workspace.id) ?? {
      total: 0,
      useful: 0,
      partial: 0,
      generic: 0
    };

    current.total += 1;

    if (row.feedback.label === "useful") {
      current.useful += 1;
    } else if (row.feedback.label === "partial") {
      current.partial += 1;
    } else if (row.feedback.label === "generic") {
      current.generic += 1;
    }

    counts.set(row.workspace.id, current);
  }

  return counts;
}

function firstByWorkspace<T extends { workspace: { id: string } }>(rows: T[]) {
  const latest = new Map<string, T>();

  for (const row of rows) {
    if (!latest.has(row.workspace.id)) {
      latest.set(row.workspace.id, row);
    }
  }

  return latest;
}

function buildRecentJobIssues(input: {
  diagnosticJobs: AdminDiagnosticJobRow[];
  planningJobs: AdminPlanningJobRow[];
  assetJobs: AdminAssetJobRow[];
  sopJobs: AdminSopJobRow[];
}) {
  const issues: RecentJobIssue[] = [];

  for (const entry of input.diagnosticJobs) {
    if (entry.job.status === "failed" || entry.job.error) {
      issues.push({
        id: `diagnostic:${entry.job.id}`,
        kind: "Diagnostic",
        workspace: entry.workspace,
        status: entry.job.status,
        error: entry.job.error,
        createdAt: entry.job.createdAt,
        requestedByUser: entry.requestedByUser,
        detail: entry.result
          ? `Score ${entry.result.overallMaturityScore}/100 · ${entry.result.confidence} confidence`
          : "No saved result"
      });
    }
  }

  for (const entry of input.planningJobs) {
    if (entry.job.status === "failed" || entry.job.error) {
      issues.push({
        id: `planning:${entry.job.id}`,
        kind:
          entry.job.jobType === "roadmap_generation" ? "Roadmap job" : "30-day plan job",
        workspace: entry.workspace,
        status: entry.job.status,
        error: entry.job.error,
        createdAt: entry.job.createdAt,
        requestedByUser: entry.requestedByUser,
        detail: [
          entry.roadmap ? "roadmap saved" : null,
          entry.actionPlan ? "actions saved" : null,
          entry.thirtyDayPlan ? "30-day saved" : null
        ]
          .filter(Boolean)
          .join(" · ") || "No saved planning artifacts"
      });
    }
  }

  for (const entry of input.assetJobs) {
    if (entry.job.status === "failed" || entry.job.error) {
      issues.push({
        id: `asset:${entry.job.id}`,
        kind: "Asset job",
        workspace: entry.workspace,
        status: entry.job.status,
        error: entry.job.error,
        createdAt: entry.job.createdAt,
        requestedByUser: entry.requestedByUser,
        detail: `${entry.assets.length} saved assets`
      });
    }
  }

  for (const entry of input.sopJobs) {
    if (entry.job.status === "failed" || entry.job.error) {
      issues.push({
        id: `sop:${entry.job.id}`,
        kind: "SOP job",
        workspace: entry.workspace,
        status: entry.job.status,
        error: entry.job.error,
        createdAt: entry.job.createdAt,
        requestedByUser: entry.requestedByUser,
        detail: `${entry.artifacts.length} saved SOPs`
      });
    }
  }

  return issues.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export default async function AdminPage() {
  try {
    const currentUser = await requireInternalAdmin();
    const [
      overviewMetricsResult,
      usersResult,
      workspacesResult,
      auditLogsResult,
      outputFeedbackResult,
      diagnosticJobsResult,
      planningJobsResult,
      assetJobsResult,
      sopJobsResult,
      supportRequestsResult,
      deletionRequestsResult,
      workspaceMembersResult,
      pendingInvitationsResult
    ] = await Promise.all([
      loadAdminDataset(getAdminOverviewMetrics(), {
        allAccounts: 0,
        workspaceMembers: 0,
        pendingInvites: 0,
        internalAdmins: 0
      }),
      loadAdminDataset(listUsers(), []),
      loadAdminDataset(listWorkspaces(), []),
      loadAdminDataset(listAdminAuditLogs(50), []),
      loadAdminDataset(listAdminOutputFeedback(200), []),
      loadAdminDataset(listAdminDiagnosticJobs(100), []),
      loadAdminDataset(listAdminPlanningJobs(100), []),
      loadAdminDataset(listAdminAssetJobs(100), []),
      loadAdminDataset(listAdminSopJobs(100), []),
      loadAdminDataset(listAdminSupportRequests(100), []),
      loadAdminDataset(listAdminDeletionRequests(100), []),
      loadAdminDataset(listAdminWorkspaceMembers(), []),
      loadAdminDataset(listAdminPendingInvitations(), [])
    ]);

    const overviewMetrics = overviewMetricsResult.data;
    const users = usersResult.data;
    const workspaces = workspacesResult.data;
    const auditLogs = auditLogsResult.data;
    const outputFeedbackEntries = outputFeedbackResult.data;
    const diagnosticJobs = diagnosticJobsResult.data;
    const planningJobs = planningJobsResult.data;
    const assetJobs = assetJobsResult.data;
    const sopJobs = sopJobsResult.data;
    const supportRequests = supportRequestsResult.data;
    const deletionRequests = deletionRequestsResult.data;
    const workspaceMembers = workspaceMembersResult.data;
    const pendingInvitations = pendingInvitationsResult.data;

    const degradedSections = [
      overviewMetricsResult.status !== "ok" ? "overview metrics" : null,
      usersResult.status !== "ok" ? "users" : null,
      workspacesResult.status !== "ok" ? "workspaces" : null,
      auditLogsResult.status !== "ok" ? "audit log" : null,
      outputFeedbackResult.status !== "ok" ? "output feedback" : null,
      diagnosticJobsResult.status !== "ok" ? "diagnostic jobs" : null,
      planningJobsResult.status !== "ok" ? "planning jobs" : null,
      assetJobsResult.status !== "ok" ? "asset jobs" : null,
      sopJobsResult.status !== "ok" ? "SOP jobs" : null,
      supportRequestsResult.status !== "ok" ? "support requests" : null,
      deletionRequestsResult.status !== "ok" ? "deletion requests" : null,
      workspaceMembersResult.status !== "ok" ? "workspace members" : null,
      pendingInvitationsResult.status !== "ok" ? "pending invites" : null
    ].filter(Boolean) as string[];

    const usersById = new Map(users.map((user) => [user.id, user]));
    const internalAdmins = users.filter((user) => user.globalRole === "internal_admin");
    const openSupportRequests = supportRequests.filter(
      (entry) => !["resolved", "closed"].includes(entry.request.status)
    );
    const openDeletionRequests = deletionRequests.filter(
      (entry) => !["rejected", "completed"].includes(entry.request.status)
    );
    const attentionFeedback = outputFeedbackEntries.filter(
      (entry) => entry.feedback.label === "partial" || entry.feedback.label === "generic"
    );
    const workspacesNeedingReview = workspaces.filter((workspace) =>
      ["past_due", "canceled", "suspended", "archived"].includes(workspace.accountState)
    );

    const recentJobIssues = buildRecentJobIssues({
      diagnosticJobs,
      planningJobs,
      assetJobs,
      sopJobs
    });

    const supportCountsByWorkspace = buildRequestCountsByWorkspace(
      supportRequests,
      (status) => !["resolved", "closed"].includes(status)
    );
    const deletionCountsByWorkspace = buildRequestCountsByWorkspace(
      deletionRequests,
      (status) => !["rejected", "completed"].includes(status)
    );
    const feedbackCountsByWorkspace = buildFeedbackCountsByWorkspace(outputFeedbackEntries);

    const latestFeedbackByWorkspace = firstByWorkspace(outputFeedbackEntries);
    const latestDiagnosticByWorkspace = firstByWorkspace(diagnosticJobs);
    const latestRoadmapByWorkspace = firstByWorkspace(
      planningJobs.filter((entry) => entry.job.jobType === "roadmap_generation")
    );
    const latestThirtyDayByWorkspace = firstByWorkspace(
      planningJobs.filter((entry) => entry.job.jobType === "thirty_day_plan_generation")
    );
    const latestAssetByWorkspace = firstByWorkspace(assetJobs);
    const latestSopByWorkspace = firstByWorkspace(sopJobs);
    const latestIssueByWorkspace = firstByWorkspace(
      recentJobIssues.map((issue) => ({
        workspace: issue.workspace,
        issue
      }))
    );

    const workspaceRows: AdminWorkspaceViewRow[] = workspaces.map((workspace) => ({
      workspace,
      owner: usersById.get(workspace.ownerUserId),
      supportCounts: supportCountsByWorkspace.get(workspace.id) ?? { total: 0, open: 0 },
      deletionCounts: deletionCountsByWorkspace.get(workspace.id) ?? { total: 0, open: 0 },
      feedbackCounts: feedbackCountsByWorkspace.get(workspace.id) ?? {
        total: 0,
        useful: 0,
        partial: 0,
        generic: 0
      },
      latestFeedback: latestFeedbackByWorkspace.get(workspace.id),
      latestDiagnostic: latestDiagnosticByWorkspace.get(workspace.id),
      latestRoadmap: latestRoadmapByWorkspace.get(workspace.id),
      latestThirtyDay: latestThirtyDayByWorkspace.get(workspace.id),
      latestAsset: latestAssetByWorkspace.get(workspace.id),
      latestSop: latestSopByWorkspace.get(workspace.id),
      latestIssue: latestIssueByWorkspace.get(workspace.id)?.issue
    }));

    const tabCounts = {
      "needs-attention":
        openSupportRequests.length +
        openDeletionRequests.length +
        workspacesNeedingReview.length +
        recentJobIssues.length +
        attentionFeedback.length,
      workspaces: workspaces.length,
      jobs: recentJobIssues.length,
      "users-access": pendingInvitations.length + internalAdmins.length,
      logs: auditLogs.length + outputFeedbackEntries.length
    } satisfies Partial<
      Record<"overview" | "needs-attention" | "workspaces" | "jobs" | "users-access" | "logs", number>
    >;

    return (
      <div className="page-shell flex flex-col gap-8 pt-0">
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">Internal admin</span>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
            Founder control plane for system state, queues, access, and history.
          </h1>
          <p className="mt-4 body-lg">
            The admin surface now separates global health, action-needed queues,
            workspace/customer visibility, technical job history, access control,
            and audit logs. Underlying controls remain manual and preview-only.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Signed in as <strong className="text-ink">{currentUser.fullName}</strong>
              </span>
              <span>·</span>
              <span>{currentUser.email}</span>
            </div>

            <form action="/api/admin/logout" method="post">
              <button
                className="rounded-full border border-[color:var(--border)] bg-white/85 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>

          {degradedSections.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              Some admin data is temporarily delayed from the database:{" "}
              {degradedSections.join(", ")}. The page is still usable; refresh in a
              moment if a section looks empty.
            </div>
          ) : null}
        </section>

        <AdminTabsShell
          jobs={
            <JobsPanel
              assetJobs={assetJobs}
              diagnosticJobs={diagnosticJobs}
              planningJobs={planningJobs}
              recentJobIssues={recentJobIssues}
              sopJobs={sopJobs}
            />
          }
          needsAttention={
            <NeedsAttentionPanel
              attentionFeedback={attentionFeedback}
              openDeletionRequests={openDeletionRequests}
              openSupportRequests={openSupportRequests}
              recentJobIssues={recentJobIssues}
              workspaceRows={workspaceRows.filter((row) =>
                ["past_due", "canceled", "suspended", "archived"].includes(
                  row.workspace.accountState
                )
              )}
            />
          }
          overview={
            <OverviewPanel
              foundationDbMode={env.foundationDbMode}
              hasStripe={env.hasStripe}
              openDeletionRequests={openDeletionRequests}
              openSupportRequests={openSupportRequests}
              overviewMetrics={overviewMetrics}
              recentJobIssues={recentJobIssues}
              workspacesNeedingReview={workspacesNeedingReview}
            />
          }
          tabCounts={tabCounts}
          usersAccess={
            <UsersAccessPanel
              internalAdmins={internalAdmins}
              overviewMetrics={overviewMetrics}
              pendingInvitations={pendingInvitations}
              users={users}
              workspaceMembers={workspaceMembers}
            />
          }
          workspaces={<WorkspacesPanel workspaceRows={workspaceRows} />}
          logs={
            <LogsPanel
              auditLogs={auditLogs}
              outputFeedbackEntries={outputFeedbackEntries}
            />
          }
        />
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

function OverviewPanel({
  foundationDbMode,
  hasStripe,
  overviewMetrics,
  openSupportRequests,
  openDeletionRequests,
  recentJobIssues,
  workspacesNeedingReview
}: {
  foundationDbMode: "remote" | "embedded" | "missing";
  hasStripe: boolean;
  overviewMetrics: AdminOverviewMetrics;
  openSupportRequests: AdminSupportRequestRow[];
  openDeletionRequests: AdminDeletionRequestRow[];
  recentJobIssues: RecentJobIssue[];
  workspacesNeedingReview: WorkspaceRecord[];
}) {
  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Overview"
          title="System state at a glance"
          body="Use this first to understand whether the preview environment is healthy, where operational load is accumulating, and whether follow-up belongs in queues, workspaces, jobs, or logs."
        />

        <div className="foundry-card-grid mt-6">
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
            detail="Open invites that have not been accepted or expired."
            label="Pending invites"
            value={String(overviewMetrics.pendingInvites)}
          />
          <StatusCard
            detail="Accounts with internal admin access."
            label="Internal admins"
            value={String(overviewMetrics.internalAdmins)}
          />
          <StatusCard
            detail="Support requests still awaiting closure."
            label="Open support requests"
            value={String(openSupportRequests.length)}
          />
          <StatusCard
            detail="Deletion requests still under review or incomplete."
            label="Open deletion requests"
            value={String(openDeletionRequests.length)}
          />
          <StatusCard
            detail="Recent failed jobs surfaced from the loaded history."
            label="Recent job issues"
            value={String(recentJobIssues.length)}
          />
          <StatusCard
            detail="Past due, canceled, suspended, or archived workspaces."
            label="Workspaces needing review"
            value={String(workspacesNeedingReview.length)}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Operating summary
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <SummaryRow
              label="Database mode"
              value={
                foundationDbMode === "remote"
                  ? "Configured"
                  : foundationDbMode === "embedded"
                    ? "Embedded dev database"
                    : "Missing DATABASE_URL"
              }
            />
            <SummaryRow
              label="Billing state"
              value={hasStripe ? "Configured but intentionally disabled" : "Disabled"}
            />
            <SummaryRow
              label="Queues to handle"
              value={`${openSupportRequests.length} support · ${openDeletionRequests.length} deletion`}
            />
            <SummaryRow
              label="Technical issues surfaced"
              value={`${recentJobIssues.length} recent failed jobs in loaded history`}
            />
          </div>
        </article>

        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            How to use this admin
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
            <p>
              <strong className="text-ink">Needs attention</strong> is the founder’s
              working queue for support, deletion, manual account-state review, and
              recent failed jobs, plus partial/generic pilot feedback.
            </p>
            <p>
              <strong className="text-ink">Workspaces</strong> is the concise customer
              view. It keeps plan, state, language, request counts, and latest output
              status together.
            </p>
            <p>
              <strong className="text-ink">Jobs</strong> and{" "}
              <strong className="text-ink">Logs</strong> hold the verbose technical
              history and feedback history so the overview stays readable.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

function NeedsAttentionPanel({
  attentionFeedback,
  openSupportRequests,
  openDeletionRequests,
  workspaceRows,
  recentJobIssues
}: {
  attentionFeedback: AdminOutputFeedbackRow[];
  openSupportRequests: AdminSupportRequestRow[];
  openDeletionRequests: AdminDeletionRequestRow[];
  workspaceRows: AdminWorkspaceViewRow[];
  recentJobIssues: RecentJobIssue[];
}) {
  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Needs attention"
          title="What needs handling today"
          body="This section is the working queue: open support, open deletions, workspaces in restricted states, recent failed jobs, and low-signal pilot feedback worth reviewing."
        />

        <div className="foundry-card-grid mt-6">
          <StatusCard
            detail="Submitted, triaged, or in-progress support work."
            label="Open support"
            value={String(openSupportRequests.length)}
          />
          <StatusCard
            detail="Deletion requests still under review or awaiting completion."
            label="Open deletions"
            value={String(openDeletionRequests.length)}
          />
          <StatusCard
            detail="Workspaces in non-active operating states."
            label="Workspaces needing review"
            value={String(workspaceRows.length)}
          />
          <StatusCard
            detail="Recent failed jobs surfaced from the loaded history."
            label="Recent job issues"
            value={String(recentJobIssues.length)}
          />
          <StatusCard
            detail="Recent pilot feedback marked partial or generic."
            label="Partial / generic feedback"
            value={String(attentionFeedback.length)}
          />
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Support queue"
          title="Open support requests"
          body="These requests still use manual pilot operations. Status and internal notes stay editable here."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1120px]">
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
              {openSupportRequests.length > 0 ? (
                openSupportRequests.map((entry) => (
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
                      {formatAdminDate(entry.request.createdAt)}
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
                <EmptyTableRow
                  colSpan={7}
                  message="No open support requests need handling right now."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Deletion queue"
          title="Open deletion requests"
          body="These remain manual review items in the MVP. No account or workspace is deleted automatically from the customer surface."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1200px]">
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
              {openDeletionRequests.length > 0 ? (
                openDeletionRequests.map((entry) => (
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
                      {formatAdminDate(entry.request.createdAt)}
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
                <EmptyTableRow
                  colSpan={8}
                  message="No open deletion requests need handling right now."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Workspace review"
          title="Manual account-state controls for restricted workspaces"
          body="Use this table when a workspace is past due, canceled, suspended, or archived and needs manual founder review."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1160px]">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Workspace</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Account state</th>
                <th className="px-4 py-3 font-semibold">Open requests</th>
                <th className="px-4 py-3 font-semibold">Latest issue</th>
                <th className="px-4 py-3 font-semibold">Controls</th>
              </tr>
            </thead>
            <tbody>
              {workspaceRows.length > 0 ? (
                workspaceRows.map((row) => (
                  <tr
                    key={row.workspace.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{row.workspace.name}</p>
                      <p className="text-muted">{row.workspace.slug}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {row.owner?.fullName ?? "Unknown owner"}
                      </p>
                      <p className="text-muted">
                        {row.owner?.email ?? row.workspace.ownerUserId}
                      </p>
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {humanize(row.workspace.plan)}
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {humanize(row.workspace.accountState)}
                    </td>
                    <td className="px-4 py-4">
                      <RequestStateCell
                        deletionCounts={row.deletionCounts}
                        supportCounts={row.supportCounts}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {row.latestIssue ? (
                        <div className="space-y-1">
                          <p className="font-semibold">{row.latestIssue.kind}</p>
                          <p className="text-muted">{humanize(row.latestIssue.status)}</p>
                          <p className="text-muted">{formatAdminDate(row.latestIssue.createdAt)}</p>
                        </div>
                      ) : (
                        <span className="text-muted">No recent failed job</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <AdminWorkspaceControls
                        initialPlan={row.workspace.plan}
                        initialState={row.workspace.accountState}
                        workspaceId={row.workspace.id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={7}
                  message="No workspaces are currently in a restricted review state."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Recent job issues"
          title="Technical failures that may need founder follow-up"
          body="Only failed recent jobs are surfaced here. Full technical history stays under Jobs."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1040px]">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Workspace</th>
                <th className="px-4 py-3 font-semibold">Queue</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
                <th className="px-4 py-3 font-semibold">Requested by</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentJobIssues.length > 0 ? (
                recentJobIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{issue.workspace.name}</p>
                      <p className="text-muted">{issue.workspace.slug}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold">{issue.kind}</td>
                    <td className="px-4 py-4">
                      <JobStatusBadge status={issue.status} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-muted">{issue.detail}</p>
                      <p className="mt-1 text-coral">{issue.error ?? "No error message saved."}</p>
                    </td>
                    <td className="px-4 py-4">
                      {issue.requestedByUser ? (
                        <>
                          <p className="font-semibold">{issue.requestedByUser.fullName}</p>
                          <p className="text-muted">{issue.requestedByUser.email}</p>
                        </>
                      ) : (
                        <span className="text-muted">n/a</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatAdminDate(issue.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={6}
                  message="No recent failed jobs are currently surfaced."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Pilot feedback"
          title="Recent partial or generic feedback"
          body="These entries do not mutate anything. They simply surface where a founder should review output quality before more pilots run."
        />
        <div className="mt-6">
          <OutputFeedbackTable
            emptyMessage="No partial or generic feedback needs founder review right now."
            entries={attentionFeedback}
          />
        </div>
      </section>
    </div>
  );
}

function WorkspacesPanel({
  workspaceRows
}: {
  workspaceRows: AdminWorkspaceViewRow[];
}) {
  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Workspaces"
          title="Customer-oriented workspace view"
          body="This is the concise workspace/customer table: owner, plan, account state, language, latest output status, pilot feedback summary, request counts, and manual controls."
        />

        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1640px]">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Workspace</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Account state</th>
                <th className="px-4 py-3 font-semibold">Language</th>
                <th className="px-4 py-3 font-semibold">Diagnostic</th>
                <th className="px-4 py-3 font-semibold">Roadmap / 30-day</th>
                <th className="px-4 py-3 font-semibold">Assets</th>
                <th className="px-4 py-3 font-semibold">SOPs</th>
                <th className="px-4 py-3 font-semibold">Pilot feedback</th>
                <th className="px-4 py-3 font-semibold">Support / deletion</th>
                <th className="px-4 py-3 font-semibold">Controls</th>
              </tr>
            </thead>
            <tbody>
              {workspaceRows.length > 0 ? (
                workspaceRows.map((row) => (
                  <tr
                    key={row.workspace.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{row.workspace.name}</p>
                      <p className="text-muted">{row.workspace.slug}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">
                        {row.owner?.fullName ?? "Unknown owner"}
                      </p>
                      <p className="text-muted">
                        {row.owner?.email ?? row.workspace.ownerUserId}
                      </p>
                    </td>
                    <td className="px-4 py-4 capitalize">{humanize(row.workspace.plan)}</td>
                    <td className="px-4 py-4 capitalize">
                      {humanize(row.workspace.accountState)}
                    </td>
                    <td className="px-4 py-4 uppercase">
                      {row.workspace.outputLanguage}
                    </td>
                    <td className="px-4 py-4">
                      <DiagnosticStateCell entry={row.latestDiagnostic} />
                    </td>
                    <td className="px-4 py-4">
                      <PlanningStateCell
                        roadmapEntry={row.latestRoadmap}
                        thirtyDayEntry={row.latestThirtyDay}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <AssetStateCell entry={row.latestAsset} />
                    </td>
                    <td className="px-4 py-4">
                      <SopStateCell entry={row.latestSop} />
                    </td>
                    <td className="px-4 py-4">
                      <FeedbackSummaryCell
                        counts={row.feedbackCounts}
                        latestEntry={row.latestFeedback}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <RequestStateCell
                        deletionCounts={row.deletionCounts}
                        supportCounts={row.supportCounts}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <AdminWorkspaceControls
                        initialPlan={row.workspace.plan}
                        initialState={row.workspace.accountState}
                        workspaceId={row.workspace.id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow colSpan={12} message="No workspaces provisioned yet." />
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function JobsPanel({
  diagnosticJobs,
  planningJobs,
  assetJobs,
  sopJobs,
  recentJobIssues
}: {
  diagnosticJobs: AdminDiagnosticJobRow[];
  planningJobs: AdminPlanningJobRow[];
  assetJobs: AdminAssetJobRow[];
  sopJobs: AdminSopJobRow[];
  recentJobIssues: RecentJobIssue[];
}) {
  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Jobs"
          title="Technical job history"
          body="All technical histories live here. Detailed tables stay collapsed by default so the admin can stay focused on operations until raw job inspection is needed."
        />

        <div className="foundry-card-grid mt-6">
          <StatusCard
            detail="Recent loaded diagnostic jobs."
            label="Diagnostic jobs"
            value={String(diagnosticJobs.length)}
          />
          <StatusCard
            detail="Recent loaded roadmap and 30-day planning jobs."
            label="Planning jobs"
            value={String(planningJobs.length)}
          />
          <StatusCard
            detail="Recent loaded asset generation jobs."
            label="Asset jobs"
            value={String(assetJobs.length)}
          />
          <StatusCard
            detail="Recent loaded SOP generation jobs."
            label="SOP jobs"
            value={String(sopJobs.length)}
          />
          <StatusCard
            detail="Failed jobs surfaced in the current loaded history."
            label="Recent job issues"
            value={String(recentJobIssues.length)}
          />
        </div>
      </section>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Diagnostics"
            title="Recent diagnostic job state"
            body="Expand diagnostic jobs only when you need raw run visibility."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[980px]">
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
                      <td className="px-4 py-4">
                        <JobStatusBadge status={entry.job.status} />
                      </td>
                      <td className="px-4 py-4">
                        {entry.result
                          ? `${entry.result.overallMaturityScore}/100`
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {entry.result?.confidence ?? "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatAdminDate(entry.job.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow
                    colSpan={6}
                    message="No diagnostic jobs have been created yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Roadmap and planning"
            title="Recent roadmap and 30-day plan job state"
            body="Expand planning jobs only when you need raw planning visibility."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[1260px]">
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
                        {humanize(entry.job.jobType)}
                      </td>
                      <td className="px-4 py-4">
                        <JobStatusBadge status={entry.job.status} />
                      </td>
                      <td className="px-4 py-4">{entry.roadmap ? "saved" : "n/a"}</td>
                      <td className="px-4 py-4">{entry.actionPlan ? "saved" : "n/a"}</td>
                      <td className="px-4 py-4">
                        {entry.thirtyDayPlan ? "saved" : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatAdminDate(entry.job.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow
                    colSpan={9}
                    message="No planning jobs have been created yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Assets"
            title="Recent asset generation state"
            body="Expand asset jobs only when you need raw generation visibility."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[1120px]">
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
                      <td className="px-4 py-4">
                        <JobStatusBadge status={entry.job.status} />
                      </td>
                      <td className="px-4 py-4">{entry.assets.length}</td>
                      <td className="px-4 py-4 text-muted">
                        {entry.assets.length > 0
                          ? entry.assets
                              .map((asset) => humanize(asset.assetType))
                              .join(", ")
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatAdminDate(entry.job.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow
                    colSpan={7}
                    message="No asset generation jobs have been created yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="SOPs"
            title="Recent SOP generation state"
            body="Expand SOP jobs only when you need raw generation visibility."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[1120px]">
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
                      <td className="px-4 py-4">
                        <JobStatusBadge status={entry.job.status} />
                      </td>
                      <td className="px-4 py-4">{entry.artifacts.length}</td>
                      <td className="px-4 py-4 text-muted">
                        {entry.artifacts.length > 0
                          ? entry.artifacts
                              .map((artifact) => humanize(artifact.sopType))
                              .join(", ")
                          : "n/a"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {entry.job.error ?? "none"}
                      </td>
                      <td className="px-4 py-4 text-muted">
                        {formatAdminDate(entry.job.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow
                    colSpan={7}
                    message="No SOP generation jobs have been created yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

function UsersAccessPanel({
  overviewMetrics,
  internalAdmins,
  pendingInvitations,
  workspaceMembers,
  users
}: {
  overviewMetrics: AdminOverviewMetrics;
  internalAdmins: AppUser[];
  pendingInvitations: AdminPendingInvitationRow[];
  workspaceMembers: AdminWorkspaceMemberRow[];
  users: AppUser[];
}) {
  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Users & access"
          title="Who has access to what"
          body="This section keeps authenticated accounts, workspace memberships, pending invites, and internal admin access in one place."
        />

        <div className="foundry-card-grid mt-6">
          <StatusCard
            detail="Every authenticated account saved in the auth database."
            label="All accounts"
            value={String(overviewMetrics.allAccounts)}
          />
          <StatusCard
            detail="Accounts with internal admin privileges."
            label="Internal admins"
            value={String(overviewMetrics.internalAdmins)}
          />
          <StatusCard
            detail="Accepted memberships across all workspaces."
            label="Workspace members"
            value={String(overviewMetrics.workspaceMembers)}
          />
          <StatusCard
            detail="Pending invites that have not been accepted or expired."
            label="Pending invites"
            value={String(overviewMetrics.pendingInvites)}
          />
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Internal admins"
          title="Accounts with founder-level control"
          body="These users can access the internal admin and operate manual preview controls."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[860px]">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Email verification</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {internalAdmins.length > 0 ? (
                internalAdmins.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{user.fullName}</p>
                      <p className="text-muted">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">{formatRoleLabel(user.globalRole)}</td>
                    <td className="px-4 py-4 text-muted">
                      {user.emailVerifiedAt ? formatAdminDate(user.emailVerifiedAt) : "pending"}
                    </td>
                    <td className="px-4 py-4 text-muted">{formatAdminDate(user.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={4}
                  message="No internal admin accounts were found."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Pending invites"
          title="Invites that still grant future access"
          body="These invitations are still open and can convert into workspace access."
        />
        <div className="foundry-table-frame mt-6">
          <table className="foundry-table min-w-[1080px]">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Workspace</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Invited by</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvitations.length > 0 ? (
                pendingInvitations.map((entry) => (
                  <tr
                    key={entry.invitation.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold">{entry.workspace.name}</p>
                      <p className="text-muted">{entry.workspace.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-muted">{entry.invitation.email}</td>
                    <td className="px-4 py-4 capitalize">
                      {formatRoleLabel(entry.invitation.role)}
                    </td>
                    <td className="px-4 py-4">
                      {entry.invitedByUser ? (
                        <>
                          <p className="font-semibold">{entry.invitedByUser.fullName}</p>
                          <p className="text-muted">{entry.invitedByUser.email}</p>
                        </>
                      ) : (
                        <span className="text-muted">n/a</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatAdminDate(entry.invitation.expiresAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyTableRow
                  colSpan={5}
                  message="No pending invites are open right now."
                />
              )}
            </tbody>
          </table>
        </div>
      </section>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Workspace members"
            title="Accepted memberships across all workspaces"
            body="Expand for the full workspace membership table."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[1180px]">
              <thead className="bg-white/90 text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Workspace</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Workspace role</th>
                  <th className="px-4 py-3 font-semibold">Global role</th>
                  <th className="px-4 py-3 font-semibold">Verified</th>
                </tr>
              </thead>
              <tbody>
                {workspaceMembers.length > 0 ? (
                  workspaceMembers.map((entry) => (
                    <tr
                      key={entry.membership.id}
                      className="border-t border-[color:var(--border)] align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.workspace.name}</p>
                        <p className="text-muted">
                          {entry.workspace.slug} · {entry.workspace.outputLanguage.toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">{entry.user.fullName}</p>
                        <p className="text-muted">{entry.user.email}</p>
                      </td>
                      <td className="px-4 py-4 capitalize">
                        {formatRoleLabel(entry.membership.role)}
                      </td>
                      <td className="px-4 py-4">{formatRoleLabel(entry.user.globalRole)}</td>
                      <td className="px-4 py-4 text-muted">
                        {entry.user.emailVerifiedAt
                          ? formatAdminDate(entry.user.emailVerifiedAt)
                          : "pending"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow
                    colSpan={5}
                    message="No workspace memberships have been created yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Authenticated users"
            title="Raw account list"
            body="Expand for the full authenticated account table."
          />
        </summary>

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[900px]">
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
                      <td className="px-4 py-4">{formatRoleLabel(user.globalRole)}</td>
                      <td className="px-4 py-4 text-muted">
                        {user.emailVerifiedAt ? formatAdminDate(user.emailVerifiedAt) : "pending"}
                      </td>
                      <td className="px-4 py-4 text-muted">{formatAdminDate(user.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyTableRow colSpan={4} message="No users created yet." />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

function LogsPanel({
  auditLogs,
  outputFeedbackEntries
}: {
  auditLogs: AdminAuditLogRow[];
  outputFeedbackEntries: AdminOutputFeedbackRow[];
}) {
  const affectedWorkspaceCount = new Set(auditLogs.map((entry) => entry.workspace.id)).size;
  const feedbackWorkspaceCount = new Set(
    outputFeedbackEntries.map((entry) => entry.workspace.id)
  ).size;

  return (
    <div className="space-y-6">
      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Logs"
          title="Manual admin history"
          body="Audit history and pilot feedback history live here. Both stay collapsed by default because they are important but not the first place to operate from."
        />

        <div className="foundry-card-grid mt-6">
          <StatusCard
            detail="Recent loaded admin state-change events."
            label="Recent admin changes"
            value={String(auditLogs.length)}
          />
          <StatusCard
            detail="Distinct workspaces touched by the loaded log window."
            label="Workspaces touched"
            value={String(affectedWorkspaceCount)}
          />
          <StatusCard
            detail="Recent loaded pilot feedback entries."
            label="Output feedback"
            value={String(outputFeedbackEntries.length)}
          />
          <StatusCard
            detail="Distinct workspaces represented in the loaded feedback window."
            label="Feedback workspaces"
            value={String(feedbackWorkspaceCount)}
          />
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <SectionLead
          eyebrow="Available log families"
          title="What exists today"
          body="The admin currently records workspace plan/account-state changes and pilot output feedback history."
        />
      </section>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Output feedback"
            title="Output feedback history"
            body="Expand for the raw pilot feedback history captured from workspace output screens."
          />
        </summary>
        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <OutputFeedbackTable
            emptyMessage="No output feedback has been captured yet."
            entries={outputFeedbackEntries}
          />
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
          <SectionLead
            eyebrow="Audit trail"
            title="Recent admin state changes"
            body="Expand the audit trail when you need to verify who changed workspace state and when."
          />
        </summary>
        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="foundry-table-frame">
            <table className="foundry-table min-w-[1080px]">
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
                        {formatAdminDate(entry.log.createdAt)}
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
                  <EmptyTableRow
                    colSpan={5}
                    message="No admin state changes recorded yet."
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

function formatFeedbackModuleType(value: string) {
  switch (value) {
    case "diagnostic":
      return "Diagnostic";
    case "roadmap":
      return "Roadmap";
    case "plan_30d":
      return "30-day plan";
    case "assets":
      return "Assets";
    case "sops":
      return "SOPs";
    default:
      return humanize(value);
  }
}

function FeedbackLabelBadge({
  label
}: {
  label: string;
}) {
  const classes =
    label === "useful"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : label === "partial"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      {label}
    </span>
  );
}

function FeedbackSummaryCell({
  counts,
  latestEntry
}: {
  counts: FeedbackCounts;
  latestEntry: AdminOutputFeedbackRow | undefined;
}) {
  if (!latestEntry || counts.total === 0) {
    return <span className="text-muted">No feedback yet</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <FeedbackLabelBadge label={latestEntry.feedback.label} />
        <span className="text-xs font-semibold text-ink">
          {formatFeedbackModuleType(latestEntry.feedback.moduleType)}
        </span>
      </div>
      <p className="text-xs text-muted">{formatAdminDate(latestEntry.feedback.submittedAt)}</p>
      <p className="text-xs text-muted">
        {counts.total} total · {counts.useful} useful · {counts.partial} partial ·{" "}
        {counts.generic} generic
      </p>
      {latestEntry.feedback.note ? (
        <p className="max-w-[28ch] text-xs text-muted">{latestEntry.feedback.note}</p>
      ) : null}
    </div>
  );
}

function OutputFeedbackTable({
  entries,
  emptyMessage
}: {
  entries: AdminOutputFeedbackRow[];
  emptyMessage: string;
}) {
  return (
    <div className="foundry-table-frame">
      <table className="foundry-table min-w-[1280px]">
        <thead className="bg-white/90 text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Submitted</th>
            <th className="px-4 py-3 font-semibold">Workspace</th>
            <th className="px-4 py-3 font-semibold">Module</th>
            <th className="px-4 py-3 font-semibold">Label</th>
            <th className="px-4 py-3 font-semibold">Note</th>
            <th className="px-4 py-3 font-semibold">Output ID</th>
          </tr>
        </thead>
        <tbody>
          {entries.length > 0 ? (
            entries.map((entry) => (
              <tr
                key={entry.feedback.id}
                className="border-t border-[color:var(--border)] align-top"
              >
                <td className="px-4 py-4 text-muted">
                  {formatAdminDate(entry.feedback.submittedAt)}
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold">{entry.workspace.name}</p>
                  <p className="text-muted">{entry.workspace.slug || entry.workspace.id}</p>
                </td>
                <td className="px-4 py-4 font-semibold">
                  {formatFeedbackModuleType(entry.feedback.moduleType)}
                </td>
                <td className="px-4 py-4">
                  <FeedbackLabelBadge label={entry.feedback.label} />
                </td>
                <td className="px-4 py-4 text-muted">
                  {entry.feedback.note ? (
                    <p className="max-w-[42ch]">{entry.feedback.note}</p>
                  ) : (
                    "No note"
                  )}
                </td>
                <td className="px-4 py-4">
                  {entry.feedback.outputId ? (
                    <code className="break-all text-xs text-muted">
                      {entry.feedback.outputId}
                    </code>
                  ) : (
                    <span className="text-muted">n/a</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <EmptyTableRow colSpan={6} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function DiagnosticStateCell({
  entry
}: {
  entry: AdminDiagnosticJobRow | undefined;
}) {
  if (!entry) {
    return <span className="text-muted">n/a</span>;
  }

  return (
    <div className="space-y-1">
      <JobStatusBadge status={entry.job.status} />
      <p className="text-xs text-muted">{formatAdminDate(entry.job.createdAt)}</p>
      {entry.result ? (
        <p className="text-xs text-muted">
          Score {entry.result.overallMaturityScore}/100 · {entry.result.confidence}
        </p>
      ) : null}
      {entry.job.error ? <p className="text-xs text-coral">{entry.job.error}</p> : null}
    </div>
  );
}

function PlanningStateCell({
  roadmapEntry,
  thirtyDayEntry
}: {
  roadmapEntry: AdminPlanningJobRow | undefined;
  thirtyDayEntry: AdminPlanningJobRow | undefined;
}) {
  if (!roadmapEntry && !thirtyDayEntry) {
    return <span className="text-muted">n/a</span>;
  }

  return (
    <div className="space-y-2">
      {roadmapEntry ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Roadmap
          </p>
          <JobStatusBadge status={roadmapEntry.job.status} />
          <p className="text-xs text-muted">{formatAdminDate(roadmapEntry.job.createdAt)}</p>
        </div>
      ) : null}
      {thirtyDayEntry ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            30-day
          </p>
          <JobStatusBadge status={thirtyDayEntry.job.status} />
          <p className="text-xs text-muted">{formatAdminDate(thirtyDayEntry.job.createdAt)}</p>
        </div>
      ) : null}
    </div>
  );
}

function AssetStateCell({
  entry
}: {
  entry: AdminAssetJobRow | undefined;
}) {
  if (!entry) {
    return <span className="text-muted">n/a</span>;
  }

  return (
    <div className="space-y-1">
      <JobStatusBadge status={entry.job.status} />
      <p className="text-xs text-muted">{formatAdminDate(entry.job.createdAt)}</p>
      <p className="text-xs text-muted">{entry.assets.length} assets saved</p>
      {entry.job.error ? <p className="text-xs text-coral">{entry.job.error}</p> : null}
    </div>
  );
}

function SopStateCell({
  entry
}: {
  entry: AdminSopJobRow | undefined;
}) {
  if (!entry) {
    return <span className="text-muted">n/a</span>;
  }

  return (
    <div className="space-y-1">
      <JobStatusBadge status={entry.job.status} />
      <p className="text-xs text-muted">{formatAdminDate(entry.job.createdAt)}</p>
      <p className="text-xs text-muted">{entry.artifacts.length} SOPs saved</p>
      {entry.job.error ? <p className="text-xs text-coral">{entry.job.error}</p> : null}
    </div>
  );
}

function RequestStateCell({
  supportCounts,
  deletionCounts
}: {
  supportCounts: RequestCounts;
  deletionCounts: RequestCounts;
}) {
  return (
    <div className="space-y-1 text-sm text-muted">
      <p>
        Support: {supportCounts.total} total · {supportCounts.open} open
      </p>
      <p>
        Deletion: {deletionCounts.total} total · {deletionCounts.open} open
      </p>
    </div>
  );
}

function SectionLead({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
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

function JobStatusBadge({
  status
}: {
  status: string;
}) {
  const tone =
    status === "completed"
      ? "border-teal/30 bg-teal/10 text-teal"
      : status === "failed"
        ? "border-coral/30 bg-coral/10 text-coral"
        : "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-ink";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {humanize(status)}
    </span>
  );
}

function EmptyTableRow({
  colSpan,
  message
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td className="px-4 py-6 text-muted" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  );
}
