"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as {
        error?: string;
        previewUrl?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Reset request failed.");
      }

      setMessage("If the account exists, a reset link has been prepared.");
      setPreviewUrl(payload.previewUrl ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm font-medium">
          <span>Email</span>
          <input
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            type="email"
            value={email}
          />
        </label>
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Preparing reset..." : "Send reset link"}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <p className="mt-2">
              Preview reset link:{" "}
              <a className="font-semibold text-ink underline" href={previewUrl}>
                reset password
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Remembered it?{" "}
        <Link className="font-semibold text-ink underline" href="/login">
          Go back to login
        </Link>
      </p>
    </div>
  );
}
