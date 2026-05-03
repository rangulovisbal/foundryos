"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formatWorkspaceAdminClosureAction,
  getWorkspaceAdminConfirmationPhrase,
  isDestructiveWorkspaceAdminAction,
  workspaceAdminClosureActionOptions,
  workspaceAccountStateOptions,
  workspacePlanOptions,
  type WorkspaceAdminClosureAction,
  type WorkspaceAccountState,
  type WorkspacePlan
} from "@/lib/foundation";

export function AdminWorkspaceControls({
  workspaceId,
  initialPlan,
  initialState,
  hasOpenDeletionRequest,
  openDeletionRequestStatus
}: {
  workspaceId: string;
  initialPlan: WorkspacePlan;
  initialState: WorkspaceAccountState;
  hasOpenDeletionRequest: boolean;
  openDeletionRequestStatus: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<WorkspacePlan>(initialPlan);
  const [accountState, setAccountState] =
    useState<WorkspaceAccountState>(initialState);
  const [action, setAction] =
    useState<WorkspaceAdminClosureAction>("suspend_access");
  const [restoreState, setRestoreState] = useState<"trial" | "active">(
    initialState === "trial" ? "trial" : "active"
  );
  const [note, setNote] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const settingsStateOptions = Array.from(
    new Set(
      workspaceAccountStateOptions.filter(
        (option) => !["suspended", "archived"].includes(option)
      ).concat(initialState)
    )
  ) as WorkspaceAccountState[];
  const destructiveAction = isDestructiveWorkspaceAdminAction(action);
  const confirmationPhrase = getWorkspaceAdminConfirmationPhrase(action);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: "settings", plan, accountState })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Update failed.");
      }

      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "closure_action",
          action,
          note,
          confirmationText,
          restoreState: action === "restore_access" ? restoreState : undefined
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Admin action failed.");
      }

      setMessage(`${formatWorkspaceAdminClosureAction(action)} applied.`);
      setNote("");
      setConfirmationText("");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Admin action could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Plan and state
        </p>
        <p className="mt-2 text-xs text-muted">
          Use the closure controls below for suspension, archival, and deletion review.
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
            disabled={loading}
            onClick={handleSave}
            type="button"
          >
            {loading ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>

      <details className="rounded-2xl border border-[color:var(--border)] bg-white/80">
        <summary className="cursor-pointer px-3 py-3 text-sm font-semibold text-ink">
          Account closure controls
        </summary>

        <div className="grid gap-3 border-t border-[color:var(--border)] px-3 py-3">
          <p className="text-xs text-muted">
            This does not permanently delete data yet.
          </p>
          {hasOpenDeletionRequest ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Open deletion review: {openDeletionRequestStatus ?? "submitted"}.
            </div>
          ) : null}
          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Action
            <select
              className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm font-medium normal-case text-ink outline-none"
              onChange={(event) => {
                setAction(event.target.value as WorkspaceAdminClosureAction);
                setConfirmationText("");
                setMessage(null);
              }}
              value={action}
            >
              {workspaceAdminClosureActionOptions.map((option) => (
                <option key={option} value={option}>
                  {formatWorkspaceAdminClosureAction(option)}
                </option>
              ))}
            </select>
          </label>

          {action === "restore_access" ? (
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Restore into
              <select
                className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm font-medium normal-case text-ink outline-none"
                onChange={(event) =>
                  setRestoreState(event.target.value as "trial" | "active")
                }
                value={restoreState}
              >
                <option value="trial">trial</option>
                <option value="active">active</option>
              </select>
            </label>
          ) : null}

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Reason or note
            <textarea
              className="min-h-[88px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional founder note for the audit log and deletion review."
              value={note}
            />
          </label>

          {destructiveAction ? (
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Type to confirm
              <div className="rounded-xl border border-[color:var(--border)] bg-white/75 px-3 py-2 text-xs normal-case text-muted">
                Type <code className="font-semibold text-ink">{confirmationPhrase}</code> to
                confirm.
              </div>
              <input
                className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                onChange={(event) => setConfirmationText(event.target.value)}
                value={confirmationText}
              />
            </label>
          ) : null}

          <button
            className="rounded-xl border border-[color:var(--border)] bg-ink px-3 py-2 text-sm font-semibold text-sand disabled:opacity-60"
            disabled={
              loading ||
              (destructiveAction && confirmationText !== confirmationPhrase) ||
              (action === "cancel_deletion_mark" && !hasOpenDeletionRequest)
            }
            onClick={handleAction}
            type="button"
          >
            {loading ? "Applying..." : formatWorkspaceAdminClosureAction(action)}
          </button>
        </div>
      </details>

      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
