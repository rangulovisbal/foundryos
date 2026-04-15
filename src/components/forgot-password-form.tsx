"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);
    setEmailDelivery(true);

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
        emailDelivery?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Reset request failed.");
      }

      setMessage("If the account exists, a reset link has been prepared.");
      setPreviewUrl(payload.previewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);
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
            <div className="mt-3 space-y-3">
              <p>
                No email will be sent while Resend is not configured. Use this
                MVP preview link to reset the password now.
              </p>
              <a
                className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sand"
                href={previewUrl}
              >
                Reset password now
              </a>
            </div>
          ) : !emailDelivery ? (
            <p className="mt-2">
              Reset email delivery is unavailable in this environment. Configure
              Resend or enable preview auth links before relying on reset here.
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
