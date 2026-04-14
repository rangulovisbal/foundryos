"use client";

import { useState } from "react";

import {
  workspaceAccountStateOptions,
  workspacePlanOptions,
  type WorkspaceAccountState,
  type WorkspacePlan
} from "@/lib/foundation";

export function AdminWorkspaceControls({
  workspaceId,
  initialPlan,
  initialState
}: {
  workspaceId: string;
  initialPlan: WorkspacePlan;
  initialState: WorkspaceAccountState;
}) {
  const [plan, setPlan] = useState<WorkspacePlan>(initialPlan);
  const [accountState, setAccountState] =
    useState<WorkspaceAccountState>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan, accountState })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Update failed.");
      }

      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-2">
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
        {workspaceAccountStateOptions.map((option) => (
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
        {loading ? "Saving..." : "Save"}
      </button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </div>
  );
}
