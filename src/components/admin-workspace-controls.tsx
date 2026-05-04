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

type RecoveryAction =
  | "suspend_access"
  | "restore_trial"
  | "restore_active"
  | "archive_workspace"
  | "mark_deletion_review"
  | "cancel_deletion_mark";

export function AdminWorkspaceControls({
  workspaceId,
  workspaceSlug,
  initialPlan,
  initialState,
  hasOpenDeletionRequest,
  openDeletionRequestStatus,
  isDirectDeleteEligible,
  directDeleteBlockedReason
}: {
  workspaceId: string;
  workspaceSlug: string;
  initialPlan: WorkspacePlan;
  initialState: WorkspaceAccountState;
  hasOpenDeletionRequest: boolean;
  openDeletionRequestStatus: string | null;
  isDirectDeleteEligible: boolean;
  directDeleteBlockedReason: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<WorkspacePlan>(initialPlan);
  const [accountState, setAccountState] =
    useState<WorkspaceAccountState>(initialState);
  const [recoveryAction, setRecoveryAction] =
    useState<RecoveryAction>("restore_trial");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [recoveryConfirmationText, setRecoveryConfirmationText] = useState("");
  const [cleanupNote, setCleanupNote] = useState("");
  const [cleanupConfirmationText, setCleanupConfirmationText] = useState("");
  const [confirmedTestCleanup, setConfirmedTestCleanup] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<"settings" | "recovery" | "cleanup" | null>(
    null
  );

  const settingsStateOptions = Array.from(
    new Set(
      workspaceAccountStateOptions.filter(
        (option) => !["suspended", "archived"].includes(option)
      ).concat(initialState)
    )
  ) as WorkspaceAccountState[];

  const recoveryActionLabel =
    recoveryAction === "suspend_access"
      ? "Suspend access"
      : recoveryAction === "restore_trial"
        ? "Restore workspace to trial"
        : recoveryAction === "restore_active"
          ? "Restore workspace to active"
          : recoveryAction === "archive_workspace"
            ? "Archive workspace"
            : recoveryAction === "mark_deletion_review"
              ? "Mark for deletion review"
              : "Cancel deletion review";
  const recoveryConfirmationPhrase =
    recoveryAction === "suspend_access" ||
    recoveryAction === "archive_workspace" ||
    recoveryAction === "mark_deletion_review"
      ? getWorkspaceAdminConfirmationPhrase(
          recoveryAction === "suspend_access"
            ? "suspend_access"
            : recoveryAction === "archive_workspace"
              ? "archive_workspace"
              : "mark_deletion_review"
        )
      : null;
  const cleanupConfirmationPhrase = getDeleteWorkspaceConfirmationPhrase(workspaceSlug);
  const canApplyRecovery =
    loadingMode === null &&
    (!recoveryConfirmationPhrase || recoveryConfirmationText === recoveryConfirmationPhrase) &&
    !(recoveryAction === "cancel_deletion_mark" && !hasOpenDeletionRequest);
  const canApplyCleanup =
    loadingMode === null &&
    isDirectDeleteEligible &&
    confirmedTestCleanup &&
    cleanupConfirmationText === cleanupConfirmationPhrase;

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
      setMessage("Plan and state saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setLoadingMode(null);
    }
  }

  async function handleRecoveryAction() {
    const action =
      recoveryAction === "restore_trial" || recoveryAction === "restore_active"
        ? "restore_access"
        : recoveryAction;
    const restoreState =
      recoveryAction === "restore_trial"
        ? "trial"
        : recoveryAction === "restore_active"
          ? "active"
          : undefined;

    setLoadingMode("recovery");
    setMessage(null);

    try {
      await patchWorkspace({
        mode: "closure_action",
        action,
        note: recoveryNote,
        confirmationText: recoveryConfirmationText,
        restoreState
      });
      setMessage(`${recoveryActionLabel} applied.`);
      setRecoveryNote("");
      setRecoveryConfirmationText("");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Recovery action could not be completed."
      );
    } finally {
      setLoadingMode(null);
    }
  }

  async function handleTestCleanup() {
    setLoadingMode("cleanup");
    setMessage(null);

    try {
      await patchWorkspace({
        mode: "closure_action",
        action: "delete_test_workspace",
        note: cleanupNote,
        confirmationText: cleanupConfirmationText,
        confirmedTestData: confirmedTestCleanup
      });
      setMessage("Delete test workspace applied.");
      setCleanupNote("");
      setCleanupConfirmationText("");
      setConfirmedTestCleanup(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Test workspace could not be deleted."
      );
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          State controls
        </p>
        <p className="mt-2 text-xs text-muted">
          Change commercial plan or nominal account state here. Recovery and deletion
          review stay separate below.
        </p>
        <div className="mt-3 grid gap-2">
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
          <button
            className="rounded-xl border border-[color:var(--border)] bg-ink px-3 py-2 text-sm font-semibold text-sand disabled:opacity-60"
            disabled={loadingMode !== null}
            onClick={handleSaveSettings}
            type="button"
          >
            {loadingMode === "settings" ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Recovery & deletion review
        </p>
        <p className="mt-2 text-xs text-muted">
          Use these controls to suspend access, restore the workspace to trial or
          active, archive it, or move it into deletion review. This does not
          permanently delete data yet.
        </p>
        {hasOpenDeletionRequest ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Open deletion review: {openDeletionRequestStatus ?? "submitted"}.
          </div>
        ) : null}
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Action
            <select
              className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm font-medium normal-case text-ink outline-none"
              onChange={(event) => {
                setRecoveryAction(event.target.value as RecoveryAction);
                setRecoveryConfirmationText("");
                setMessage(null);
              }}
              value={recoveryAction}
            >
              <option value="restore_trial">Restore workspace to trial</option>
              <option value="restore_active">Restore workspace to active</option>
              <option value="suspend_access">Suspend access</option>
              <option value="archive_workspace">Archive workspace</option>
              <option value="mark_deletion_review">Mark for deletion review</option>
              <option value="cancel_deletion_mark">Cancel deletion review</option>
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Reason or note
            <textarea
              className="min-h-[88px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
              onChange={(event) => setRecoveryNote(event.target.value)}
              placeholder="Optional founder note for the audit log or deletion review."
              value={recoveryNote}
            />
          </label>

          {recoveryConfirmationPhrase ? (
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Type to confirm
              <div className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs normal-case text-muted">
                Type <code className="font-semibold text-ink">{recoveryConfirmationPhrase}</code>{" "}
                to confirm.
              </div>
              <input
                className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                onChange={(event) => setRecoveryConfirmationText(event.target.value)}
                value={recoveryConfirmationText}
              />
            </label>
          ) : null}

          <button
            className="rounded-xl border border-[color:var(--border)] bg-ink px-3 py-2 text-sm font-semibold text-sand disabled:opacity-60"
            disabled={!canApplyRecovery}
            onClick={handleRecoveryAction}
            type="button"
          >
            {loadingMode === "recovery" ? "Applying..." : recoveryActionLabel}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Test cleanup
        </p>
        <p className="mt-2 text-xs text-muted">
          Delete test workspace permanently only when it is clearly demo or smoke
          data. Permanent purge for real client data is not available yet.
        </p>
        {directDeleteBlockedReason ? (
          <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs text-muted">
            {directDeleteBlockedReason}
          </div>
        ) : null}
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Cleanup note
            <textarea
              className="min-h-[88px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
              onChange={(event) => setCleanupNote(event.target.value)}
              placeholder="Optional founder note for why this test workspace is being deleted."
              value={cleanupNote}
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-3 text-xs text-muted">
            <input
              checked={confirmedTestCleanup}
              className="mt-0.5 size-4 rounded border-[color:var(--border)]"
              onChange={(event) => setConfirmedTestCleanup(event.target.checked)}
              type="checkbox"
            />
            <span>
              I confirm this workspace is test, smoke, demo, or sandbox data and not an
              active real client workspace.
            </span>
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Type to confirm
            <div className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs normal-case text-muted">
              Type <code className="font-semibold text-ink">{cleanupConfirmationPhrase}</code>{" "}
              to confirm.
            </div>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
              onChange={(event) => setCleanupConfirmationText(event.target.value)}
              value={cleanupConfirmationText}
            />
          </label>

          <button
            className="rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral disabled:opacity-60"
            disabled={!canApplyCleanup}
            onClick={handleTestCleanup}
            type="button"
          >
            {loadingMode === "cleanup" ? "Deleting..." : "Delete test workspace"}
          </button>
        </div>
      </div>

      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
