"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  initialEmail,
  redirectTo
}: {
  initialEmail: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const payload = (await response.json()) as {
        error?: string;
        requiresVerification?: boolean;
        verificationPreviewUrl?: string | null;
        emailDelivery?: boolean;
      };

      if (!response.ok) {
        if (payload.requiresVerification) {
          setMessage("Email verification required before login.");
          setPreviewUrl(payload.verificationPreviewUrl ?? null);
          setEmailDelivery(payload.emailDelivery ?? true);
          return;
        }
        throw new Error(payload.error ?? "Login failed.");
      }

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          onChange={setEmail}
          placeholder="you@company.com"
          type="email"
          value={email}
        />
        <InputField
          label="Password"
          onChange={setPassword}
          placeholder="Your password"
          type="password"
          value={password}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <p className="mt-2">
              Preview verification link:{" "}
              <a className="font-semibold text-ink underline" href={previewUrl}>
                verify email
              </a>
            </p>
          ) : !emailDelivery ? (
            <p className="mt-2">
              Verification email could not be delivered in this environment.
              Configure Resend or enable preview auth links before using login
              for unverified accounts.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm text-muted">
        <Link className="font-semibold text-ink underline" href="/forgot-password">
          Forgot password?
        </Link>
        <span>·</span>
        <Link className="font-semibold text-ink underline" href="/signup">
          Create account
        </Link>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
