"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Invitation could not be accepted.");
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Invitation could not be accepted."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
        disabled={loading}
        onClick={handleAccept}
        type="button"
      >
        {loading ? "Joining..." : "Accept invitation"}
      </button>
      {message ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {message}
        </div>
      ) : null}
    </div>
  );
}
