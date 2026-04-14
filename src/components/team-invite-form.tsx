"use client";

import { useState } from "react";

export function TeamInviteForm({
  canInvite
}: {
  canInvite: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canInvite) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);
    setEmailDelivery(true);

    try {
      const response = await fetch("/api/auth/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, role })
      });

      const payload = (await response.json()) as {
        error?: string;
        previewUrl?: string | null;
        emailDelivery?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Invite failed.");
      }

      setMessage("Invitation created for preview testing.");
      setPreviewUrl(payload.previewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);
      setEmail("");
      setRole("member");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        Invite member
      </p>
      <form className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canInvite || loading}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="new.member@company.com"
          type="email"
          value={email}
        />
        <select
          className="rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canInvite || loading}
          onChange={(event) => setRole(event.target.value)}
          value={role}
        >
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canInvite || loading}
          type="submit"
        >
          {loading ? "Inviting..." : "Send invite"}
        </button>
      </form>
      {!canInvite ? (
        <p className="mt-3 text-sm text-muted">
          Invites are disabled for your role, current account state, or current
          preview plan.
        </p>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <p className="mt-2">
              Preview invite link:{" "}
              <a className="font-semibold text-ink underline" href={previewUrl}>
                accept invitation
              </a>
            </p>
          ) : !emailDelivery ? (
            <p className="mt-2">
              Invitation delivery is unavailable in this environment. Configure
              Resend or enable preview auth links before relying on invites here.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
