"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm({
  initialEmail,
  redirectTo
}: {
  initialEmail: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, email, password })
      });

      const payload = (await response.json()) as {
        error?: string;
        verificationPreviewUrl?: string | null;
        emailDelivery?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Signup failed.");
      }

      setMessage(
        "Account created. Verify your email before accessing the authenticated preview."
      );
      setPreviewUrl(payload.verificationPreviewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);

      if (!payload.verificationPreviewUrl && (payload.emailDelivery ?? true)) {
        router.push("/verify-email?status=sent");
        return;
      }

      if (!payload.verificationPreviewUrl && !(payload.emailDelivery ?? true)) {
        setMessage(
          "Account created, but transactional email is unavailable in this environment. Configure Resend or enable preview auth links before continuing."
        );
        return;
      }

      if (redirectTo !== "/app") {
        setMessage(
          "Account created. Verify the preview link above, then you will be able to continue to the requested page."
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <InputField
          label="Full name"
          onChange={setFullName}
          placeholder="Ricardo Angulo"
          value={fullName}
        />
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
          placeholder="Minimum 10 characters"
          type="password"
          value={password}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <div className="mt-3 space-y-3">
              <p>
                No email will be sent while Resend is not configured. Use this
                MVP preview link to verify your account now.
              </p>
              <a
                className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sand"
                href={previewUrl}
              >
                Verify email now
              </a>
            </div>
          ) : !emailDelivery ? (
            <p className="mt-2">
              Transactional email is unavailable in this environment. Configure
              Resend or enable preview auth links before using signup here.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-ink underline" href="/login">
          Log in
        </Link>
      </p>
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
