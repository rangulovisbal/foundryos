"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDeleteTestAccountConfirmationPhrase } from "@/lib/foundation";

export function AdminUserCleanupControls({
  userId,
  isDeletable,
  blockedReason
}: {
  userId: string;
  isDeletable: boolean;
  blockedReason: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [confirmedTestData, setConfirmedTestData] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmationPhrase = getDeleteTestAccountConfirmationPhrase();

  async function handleDelete() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          note,
          confirmationText,
          confirmedTestData
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Delete test account failed.");
      }

      setMessage("Test account deleted.");
      setNote("");
      setConfirmationText("");
      setConfirmedTestData(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Delete test account could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="rounded-2xl border border-[color:var(--border)] bg-white/80">
      <summary className="cursor-pointer list-none px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Manage account cleanup</p>
            <p className="mt-1 text-xs text-muted">
              Test data cleanup only. Permanent deletion for real client data is not
              available yet.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Open
          </span>
        </div>
      </summary>

      <div className="grid gap-3 border-t border-[color:var(--border)] px-3 py-3">
        <section className="rounded-2xl border border-[color:var(--border)] bg-white/75 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Test data cleanup
          </p>
          <p className="mt-2 text-xs text-muted">
            Delete test account only after related test workspaces have been cleaned up.
          </p>

          {blockedReason ? (
            <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2 text-xs text-muted">
              {blockedReason}
            </div>
          ) : null}

          <div className="mt-3 grid gap-3">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Cleanup note
              <textarea
                className="min-h-[88px] rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional founder note for why this test account is being deleted."
                value={note}
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-3 text-xs text-muted">
              <input
                checked={confirmedTestData}
                className="mt-0.5 size-4 rounded border-[color:var(--border)]"
                onChange={(event) => setConfirmedTestData(event.target.checked)}
                type="checkbox"
              />
              <span>
                I confirm this account is test, demo, smoke, or sandbox data and does
                not belong to a real client.
              </span>
            </label>

            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Type to confirm
              <div className="rounded-xl border border-[color:var(--border)] bg-white/85 px-3 py-2 text-xs normal-case text-muted">
                Type <code className="font-semibold text-ink">{confirmationPhrase}</code>{" "}
                to confirm.
              </div>
              <input
                className="rounded-xl border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm normal-case text-ink outline-none"
                onChange={(event) => setConfirmationText(event.target.value)}
                value={confirmationText}
              />
            </label>

            <button
              className="rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral disabled:opacity-60"
              disabled={
                loading ||
                !isDeletable ||
                !confirmedTestData ||
                confirmationText !== confirmationPhrase
              }
              onClick={handleDelete}
              type="button"
            >
              {loading ? "Deleting..." : "Delete test account"}
            </button>
          </div>
        </section>

        {message ? <p className="text-xs text-muted">{message}</p> : null}
      </div>
    </details>
  );
}
