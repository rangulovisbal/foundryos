"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  getDeleteWorkspaceConfirmationPhrase,
  getWorkspaceAdminConfirmationPhrase,
  workspaceAccountStateOptions,
  workspacePlanOptions,
  type WorkspaceAccountState,
  type WorkspacePlan
} from "@/lib/foundation";

type WorkspaceAction =
  | "suspend_access"
  | "restore_trial"
  | "restore_active"
  | "archive_workspace"
  | "mark_deletion_review"
  | "cancel_deletion_mark"
  | "delete_test_workspace";

function WorkspaceActionButton({
  label,
  onClick,
  disabled = false,
  tone = "default"
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-coral/25 bg-coral/10 text-coral"
      : "border-[color:var(--border)] bg-white/90 text-ink";

  return (
    <button
      className={`rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-60 ${toneClass}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SummaryPill({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const classes =
    tone === "success"
      ? "border-teal/25 bg-teal/10 text-teal"
      : tone === "warning"
        ? "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-ink"
        : tone === "danger"
          ? "border-coral/25 bg-coral/10 text-coral"
          : "border-[color:var(--border)] bg-white/80 text-muted";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${classes}`}
    >
      {label}
    </span>
  );
}

function buildActionMeta(action: WorkspaceAction) {
  switch (action) {
    case "suspend_access":
      return {
        title: "Suspend access",
        submitLabel: "Suspend access",
        noteLabel: "Reason or note",
        notePlaceholder: "Optional founder note for why access is being suspended.",
        confirmationPhrase: getWorkspaceAdminConfirmationPhrase("suspend_access"),
        tone: "danger" as const
      };
    case "restore_trial":
      return {
        title: "Restore access",
        submitLabel: "Restore workspace to trial",
        noteLabel: "Reason or note",
        notePlaceholder: "Optional founder note for why access is being restored.",
        confirmationPhrase: null,
        tone: "default" as const
      };
    case "restore_active":
      return {
        title: "Restore access",
        submitLabel: "Restore workspace to active",
        noteLabel: "Reason or note",
        notePlaceholder: "Optional founder note for why access is being restored.",
        confirmationPhrase: null,
        tone: "default" as const
      };
    case "archive_workspace":
      return {
        title: "Archive workspace",
        submitLabel: "Archive workspace",
        noteLabel: "Reason or note",
        notePlaceholder: "Optional founder note for why this workspace is being archived.",
        confirmationPhrase: getWorkspaceAdminConfirmationPhrase("archive_workspace"),
        tone: "danger" as const
      };
    case "mark_deletion_review":
      return {
        title: "Mark for deletion review",
        submitLabel: "Mark for deletion review",
        noteLabel: "Review note",
        notePlaceholder: "Optional founder note for the deletion review queue.",
        confirmationPhrase: getWorkspaceAdminConfirmationPhrase("mark_deletion_review"),
        tone: "default" as const
      };
    case "cancel_deletion_mark":
      return {
        title: "Cancel deletion review",
        submitLabel: "Cancel deletion review",
        noteLabel: "Review note",
        notePlaceholder: "Optional founder note for why the deletion review is being canceled.",
        confirmationPhrase: null,
        tone: "default" as const
      };
    case "delete_test_workspace":
      return {
        title: "Delete workspace now",
        submitLabel: "Delete workspace now",
        noteLabel: "Cleanup note",
        notePlaceholder: "Optional founder note for why this workspace is being deleted.",
        confirmationPhrase: getDeleteWorkspaceConfirmationPhrase(),
        tone: "danger" as const
      };
  }
}

export function AdminWorkspaceControls({
  workspaceId,
  initialPlan,
  initialState,
  hasOpenDeletionRequest,
  openDeletionRequestStatus,
  directCleanupWarning
}: {
  workspaceId: string;
  initialPlan: WorkspacePlan;
  initialState: WorkspaceAccountState;
  hasOpenDeletionRequest: boolean;
  openDeletionRequestStatus: string | null;
  directCleanupWarning: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<WorkspacePlan>(initialPlan);
  const [accountState, setAccountState] =
    useState<WorkspaceAccountState>(initialState);
  const [activeAction, setActiveAction] = useState<WorkspaceAction | null>(null);
  const [note, setNote] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmedTestCleanup, setConfirmedTestCleanup] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<"settings" | "action" | null>(null);

  const settingsStateOptions = Array.from(
    new Set(
      workspaceAccountStateOptions.filter(
        (option) => !["suspended", "archived"].includes(option)
      ).concat(initialState)
    )
  ) as WorkspaceAccountState[];
  const actionMeta = activeAction ? buildActionMeta(activeAction) : null;
  const actionRequiresTestCheckbox = activeAction === "delete_test_workspace";
  const actionDisabledReason =
    activeAction === "cancel_deletion_mark" && !hasOpenDeletionRequest
      ? "No open deletion review to cancel."
      : null;

  async function patchWorkspace(body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Workspace admin action failed.");
    }
  }

  async function handleSaveSettings() {
    setLoadingMode("settings");
    setMessage(null);

    try {
      await patchWorkspace({ mode: "settings", plan, accountState });
      setMessage("Other settings saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setLoadingMode(null);
    }
  }

  function openAction(action: WorkspaceAction) {
    setActiveAction(action);
    setNote("");
    setConfirmationText("");
    setConfirmedTestCleanup(false);
    setMessage(null);
  }

  async function handleApplyAction() {
    if (!activeAction) {
      return;
    }

    const action =
      activeAction === "restore_trial" || activeAction === "restore_active"
        ? "restore_access"
        : activeAction;
    const restoreState =
      activeAction === "restore_trial"
        ? "trial"
        : activeAction === "restore_active"
          ? "active"
          : undefined;

    setLoadingMode("action");
    setMessage(null);

    try {
      await patchWorkspace({
        mode: "closure_action",
        action,
        note,
        confirmationText,
        restoreState,
        confirmedTestData: actionRequiresTestCheckbox ? confirmedTestCleanup : undefined
      });
      setMessage(`${actionMeta?.submitLabel ?? "Action"} applied.`);
      setActiveAction(null);
      setNote("");
      setConfirmationText("");
      setConfirmedTestCleanup(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Workspace action could not be completed."
      );
    } finally {
      setLoadingMode(null);
    }
  }

  const canApplyAction =
    loadingMode === null &&
    activeAction !== null &&
    !actionDisabledReason &&
    (!actionMeta?.confirmationPhrase ||
      confirmationText === actionMeta.confirmationPhrase) &&
    (!actionRequiresTestCheckbox || confirmedTestCleanup);

  return (
    <details className="rounded-2xl border border-[color:var(--border)] bg-white/80">
      <summary className="cursor-pointer list-none px-3 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Manage workspace</p>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Open controls
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <SummaryPill label={`State: ${initialState}`} />
            <SummaryPill
              label={
                hasOpenDeletionRequest
                  ? `Deletion review: ${openDeletionRequestStatus ?? "open"}`
                  : "Deletion review: none"
              }
              tone={hasOpenDeletionRequest ? "warning" : "neutral"}
            />
            <SummaryPill
              label="Direct cleanup available"
              tone="success"
            />
          </div>
        </div>
      </summary>

      <div className="grid gap-3 border-t border-[color:var(--border)] px-3 py-3">
        <section className="rounded-2xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Access status
          </p>
          <p className="mt-2 text-xs text-muted">
            Show and manage access state here. These actions do not permanently delete
            data.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Suspend access"
              onClick={() => openAction("suspend_access")}
            />
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Restore to trial"
              onClick={() => openAction("restore_trial")}
            />
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Restore to active"
              onClick={() => openAction("restore_active")}
            />
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Archive workspace"
              onClick={() => openAction("archive_workspace")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Real client deletion review
          </p>
          <p className="mt-2 text-xs text-muted">
            Use this for real client data. Permanent deletion for real client data is
            not available yet.
          </p>
          {hasOpenDeletionRequest ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Open deletion review: {openDeletionRequestStatus ?? "submitted"}.
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Mark for deletion review"
              onClick={() => openAction("mark_deletion_review")}
            />
            <WorkspaceActionButton
              disabled={loadingMode !== null || !hasOpenDeletionRequest}
              label="Cancel deletion review"
              onClick={() => openAction("cancel_deletion_mark")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Direct admin cleanup
          </p>
          <p className="mt-2 text-xs text-muted">
            Use this when you intentionally want to remove the workspace now. If it
            should stay on a review path, use deletion review instead.
          </p>
          {directCleanupWarning ? (
            <div className="mt-3 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 px-3 py-2 text-xs text-ink">
              {directCleanupWarning}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label="Delete workspace now"
              onClick={() => openAction("delete_test_workspace")}
              tone="danger"
            />
          </div>
        </section>

        {activeAction && actionMeta ? (
          <section className="rounded-2xl border border-[color:var(--border)] bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{actionMeta.title}</p>
                <p className="mt-1 text-xs text-muted">
                  Review the note and confirmation below before applying this action.
                </p>
              </div>
              <button
                className="text-xs font-semibold uppercase tracking-[0.16em] text-muted"
                onClick={() => {
                  setActiveAction(null);
                  setNote("");
                  setConfirmationText("");
                  setConfirmedTestCleanup(false);
                }}
                type="button"
              >
                Close
              </button>
            </div>

            {actionDisabledReason ? (
              <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2 text-xs text-muted">
                {actionDisabledReason}
              </div>
            ) : null}

            <div className="mt-3 grid gap-3">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {actionMeta.noteLabel}
                <textarea
                  className="min-h-[88px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={actionMeta.notePlaceholder}
                  value={note}
                />
              </label>

              {actionRequiresTestCheckbox ? (
                <label className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-3 text-xs text-muted">
                  <input
                    checked={confirmedTestCleanup}
                    className="mt-0.5 size-4 rounded border-[color:var(--border)]"
                    onChange={(event) => setConfirmedTestCleanup(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    I understand this will delete the workspace from the product now.
                    I have reviewed whether this data should be kept or removed.
                  </span>
                </label>
              ) : null}

              {actionMeta.confirmationPhrase ? (
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Type to confirm
                  <div className="rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2 text-xs normal-case text-muted">
                    Type{" "}
                    <code className="font-semibold text-ink">
                      {actionMeta.confirmationPhrase}
                    </code>{" "}
                    to confirm.
                  </div>
                  <input
                    className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                    onChange={(event) => setConfirmationText(event.target.value)}
                    value={confirmationText}
                  />
                </label>
              ) : null}

              <WorkspaceActionButton
                disabled={!canApplyAction}
                label={loadingMode === "action" ? "Applying..." : actionMeta.submitLabel}
                onClick={handleApplyAction}
                tone={actionMeta.tone}
              />
            </div>
          </section>
        ) : null}

        <details className="rounded-2xl border border-[color:var(--border)] bg-white/75">
          <summary className="cursor-pointer px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Other settings
          </summary>
          <div className="grid gap-2 border-t border-[color:var(--border)] px-3 py-3">
            <p className="text-xs text-muted">
              Leave this collapsed unless you need manual plan or nominal state changes.
            </p>
            <select
              className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm outline-none"
              onChange={(event) => setPlan(event.target.value as WorkspacePlan)}
              value={plan}
            >
              {workspacePlanOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm outline-none"
              onChange={(event) =>
                setAccountState(event.target.value as WorkspaceAccountState)
              }
              value={accountState}
            >
              {settingsStateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <WorkspaceActionButton
              disabled={loadingMode !== null}
              label={loadingMode === "settings" ? "Saving..." : "Save other settings"}
              onClick={handleSaveSettings}
            />
          </div>
        </details>

        {message ? <p className="text-xs text-muted">{message}</p> : null}
      </div>
    </details>
  );
}
