"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token, password })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Reset failed.");
      }

      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm font-medium">
          <span>New password</span>
          <input
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 10 characters"
            type="password"
            value={password}
          />
        </label>
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          {message}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        <Link className="font-semibold text-ink underline" href="/login">
          Return to login
        </Link>
      </p>
    </div>
  );
}
