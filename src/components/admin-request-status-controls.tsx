"use client";

import { useState } from "react";

export function AdminRequestStatusControls({
  endpoint,
  initialNotes,
  initialStatus,
  statusOptions
}: {
  endpoint: string;
  initialNotes: string | null;
  initialStatus: string;
  statusOptions: readonly string[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [adminNotes, setAdminNotes] = useState(initialNotes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status, adminNotes })
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
        onChange={(event) => setStatus(event.target.value)}
        value={status}
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-[92px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm outline-none"
        onChange={(event) => setAdminNotes(event.target.value)}
        placeholder="Optional internal note"
        value={adminNotes}
      />
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
