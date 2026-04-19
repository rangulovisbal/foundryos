"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DeletionRequestType } from "@/lib/foundation";

export function DeletionRequestForm({
  canSubmit,
  confirmationPhrase,
  description,
  requestType,
  title
}: {
  canSubmit: boolean;
  confirmationPhrase: string;
  description: string;
  requestType: DeletionRequestType;
  title: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/app/deletion-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestType,
          reason,
          confirmationText
        })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Deletion request failed.");
      }

      setFeedbackTone("success");
      setFeedback(
        "Deletion request submitted for manual review. No deletion is executed automatically in this MVP."
      );
      setReason("");
      setConfirmationText("");
      router.refresh();
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(
        error instanceof Error ? error.message : "Deletion request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canSubmit || loading}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Add context for the review team. This is optional but useful."
          value={reason}
        />
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          Type <strong className="text-ink">{confirmationPhrase}</strong> to confirm this request.
        </div>
        <input
          className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canSubmit || loading}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder={confirmationPhrase}
          value={confirmationText}
        />
        <button
          className="rounded-[24px] border border-coral/30 bg-coral/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-coral disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading ? "Submitting..." : "Submit request"}
        </button>
      </form>
      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedbackTone === "success"
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-coral/30 bg-coral/10 text-coral"
          }`}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
