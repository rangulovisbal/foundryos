"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkspaceSetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          plan: "growth-os"
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Workspace creation failed.");
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Workspace creation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="space-y-2 text-sm font-medium">
        <span>Workspace name</span>
        <input
          className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          onChange={(event) => setName(event.target.value)}
          placeholder="FoundryOS Studio"
          value={name}
        />
      </label>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
        This creates one Growth OS trial workspace for preview use. Live billing
        and automated plan provisioning are still disabled.
      </div>

      <button
        className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Creating workspace..." : "Create workspace"}
      </button>

      {message ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {message}
        </div>
      ) : null}
    </form>
  );
}
