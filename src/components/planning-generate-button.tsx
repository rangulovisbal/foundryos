"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PlanningGenerateButton({
  endpoint,
  idleLabel,
  loadingLabel,
  successLabel,
  canGenerate,
  disabledReason
}: {
  endpoint: string;
  idleLabel: string;
  loadingLabel: string;
  successLabel: string;
  canGenerate: boolean;
  disabledReason: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!canGenerate) {
      setMessageTone("error");
      setMessage(disabledReason);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed.");
      }

      setMessageTone("success");
      setMessage(successLabel);
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
        disabled={loading}
        onClick={handleGenerate}
        type="button"
      >
        {loading ? loadingLabel : idleLabel}
      </button>
      {!canGenerate ? <p className="text-sm text-muted">{disabledReason}</p> : null}
      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-coral/30 bg-coral/10 text-coral"
          }`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
