"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: token.trim() }),
        signal: controller.signal
      });
      window.clearTimeout(timeout);

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed.");
      }

      setSuccess(true);
      window.location.assign("/admin");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed. Check the admin token and database connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell pt-0">
      <section className="surface mx-auto max-w-2xl p-6 md:p-8">
        <span className="eyebrow">Internal admin</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
          Access the operating back office.
        </h1>
        <p className="mt-4 body-lg">
          This bootstrap flow creates an internal admin session for preview
          operations. It is strictly for MVP testing while managed admin auth
          and live billing controls remain out of scope.
        </p>
        <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          If this bootstrap fails with a configuration error, the environment is
          missing the database connection required for admin auth.
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm font-medium">
            <span>Admin access token</span>
            <input
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
              onChange={(event) => setToken(event.target.value)}
              type="password"
              value={token}
            />
          </label>

          <button
            className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Checking..." : "Open admin"}
          </button>

          {error ? <p className="text-sm text-coral">{error}</p> : null}
          {success ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              <p>Admin session created. If the redirect does not open automatically:</p>
              <a className="mt-2 inline-flex font-semibold text-ink underline" href="/admin">
                Open admin dashboard
              </a>
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
}
