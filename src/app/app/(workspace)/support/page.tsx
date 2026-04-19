import { DeletionRequestForm } from "@/components/deletion-request-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { SupportRequestForm } from "@/components/support-request-form";
import {
  listDeletionRequests,
  listSupportRequests
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canRequestAccountDeletion,
  canRequestWorkspaceDeletion,
  canSubmitSupportRequest,
  formatDeletionRequestStatus,
  formatDeletionRequestType,
  formatSupportIssueType,
  formatSupportRequestStatus,
  getDeletionConfirmationPhrase,
  isLockedState
} from "@/lib/foundation";

const faqItems = [
  {
    question: "What FoundryOS does",
    answer:
      "FoundryOS turns saved business context into structured diagnostics, planning, assets, and SOPs so a founder or operator can review operating priorities in one workspace."
  },
  {
    question: "What is preview-only right now",
    answer:
      "Billing automation, live checkout control, production support operations, and deeper downstream delivery workflows remain preview-only or manual in the current MVP."
  },
  {
    question: "How outputs are generated",
    answer:
      "Each module reads saved workspace context and persisted upstream artifacts. The app stores deterministic structured outputs and histories instead of showing a raw one-off AI text dump."
  },
  {
    question: "What output language means",
    answer:
      "Output language controls the language of generated business artifacts. The current app interface remains English while outputs normalize into the selected workspace language."
  },
  {
    question: "What billing status means",
    answer:
      "Billing status controls preview access and write restrictions at the workspace level. Live billing is not yet the system of record, so internal admin still manages state manually for MVP testing."
  },
  {
    question: "How support works",
    answer:
      "Support requests submitted here are stored in the product and reviewed manually by the founder/internal admin team. There is no full ticketing portal or SLA automation yet."
  },
  {
    question: "How to request account or workspace deletion",
    answer:
      "Use the request forms on this page. They create tracked review requests only. No account or workspace is deleted automatically from this UI in the current MVP."
  }
] as const;

export default async function SupportPage() {
  const context = await requireWorkspaceContext("/app/support");
  const canViewWorkspaceRequests = ["owner", "admin"].includes(
    context.membership.role
  );
  const [supportRequests, accountDeletionRequests, workspaceDeletionRequests] =
    await Promise.all([
      listSupportRequests({
        workspaceId: context.workspace.id,
        requestedByUserId: canViewWorkspaceRequests ? undefined : context.user.id,
        limit: 20
      }),
      listDeletionRequests({
        workspaceId: context.workspace.id,
        requestedByUserId: context.user.id,
        requestType: "account_deletion",
        limit: 10
      }),
      canViewWorkspaceRequests
        ? listDeletionRequests({
            workspaceId: context.workspace.id,
            requestType: "workspace_deletion",
            limit: 10
          })
        : Promise.resolve([])
    ]);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Support and trust</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Help, support requests, and controlled deletion requests.
        </h2>
        <p className="mt-4 body-lg">
          This MVP route is the minimum operational trust layer for pilot use.
          Support and deletion flows are tracked here, but execution still
          happens manually.
        </p>
        <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          Support and deletion request forms remain available even when the
          workspace is in a restricted preview state.
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {faqItems.map((item) => (
          <article
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-6"
            key={item.question}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              FAQ
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
              {item.question}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SupportRequestForm canSubmit={canSubmitSupportRequest()} />
        <SupportHistoryPanel
          canViewWorkspaceRequests={canViewWorkspaceRequests}
          supportRequests={supportRequests}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DeletionRequestForm
          canSubmit={canRequestAccountDeletion()}
          confirmationPhrase={getDeletionConfirmationPhrase("account_deletion")}
          description="Request manual review of your account deletion. This does not execute immediate hard deletion from the app."
          requestType="account_deletion"
          title="Request account deletion"
        />
        <DeletionRequestForm
          canSubmit={canRequestWorkspaceDeletion(context.membership.role)}
          confirmationPhrase={getDeletionConfirmationPhrase("workspace_deletion")}
          description="Only workspace owners and admins can request workspace deletion. This creates a tracked review request; no workspace is deleted automatically from this UI."
          requestType="workspace_deletion"
          title="Request workspace deletion"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DeletionHistoryPanel
          deletionRequests={accountDeletionRequests}
          title="Your account deletion requests"
        />
        <DeletionHistoryPanel
          deletionRequests={workspaceDeletionRequests}
          title="Workspace deletion requests"
        />
      </section>
    </div>
  );
}

function SupportHistoryPanel({
  canViewWorkspaceRequests,
  supportRequests
}: {
  canViewWorkspaceRequests: boolean;
  supportRequests: Awaited<ReturnType<typeof listSupportRequests>>;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">
        {canViewWorkspaceRequests ? "Workspace support queue" : "Your support requests"}
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        Recent support requests
      </h3>
      <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
        <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
          <thead className="bg-white/90 text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Issue</th>
              {canViewWorkspaceRequests ? (
                <th className="px-4 py-3 font-semibold">Requester</th>
              ) : null}
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {supportRequests.length > 0 ? (
              supportRequests.map((entry) => (
                <tr
                  className="border-t border-[color:var(--border)] align-top"
                  key={entry.request.id}
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {formatSupportIssueType(entry.request.issueType)}
                    </p>
                    <p className="mt-2 max-w-[52ch] text-muted">
                      {entry.request.message}
                    </p>
                  </td>
                  {canViewWorkspaceRequests ? (
                    <td className="px-4 py-4">
                      <p className="font-semibold">{entry.requestedByUser.fullName}</p>
                      <p className="text-muted">{entry.requestedByUser.email}</p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4 capitalize">
                    {formatSupportRequestStatus(entry.request.status)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {new Date(entry.request.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-muted"
                  colSpan={canViewWorkspaceRequests ? 4 : 3}
                >
                  No support requests have been submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeletionHistoryPanel({
  deletionRequests,
  title
}: {
  deletionRequests: Awaited<ReturnType<typeof listDeletionRequests>>;
  title: string;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Deletion requests</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
      <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
        <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
          <thead className="bg-white/90 text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {deletionRequests.length > 0 ? (
              deletionRequests.map((entry) => (
                <tr
                  className="border-t border-[color:var(--border)] align-top"
                  key={entry.request.id}
                >
                  <td className="px-4 py-4 font-semibold">
                    {formatDeletionRequestType(entry.request.requestType)}
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {formatDeletionRequestStatus(entry.request.status)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {entry.request.reason ?? "No reason added."}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {new Date(entry.request.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={4}>
                  No deletion requests have been submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
