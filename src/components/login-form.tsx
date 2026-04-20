"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function LoginForm({
  canSubmit,
  initialEmail,
  initialMessage,
  language,
  redirectTo
}: {
  canSubmit: boolean;
  initialEmail: string;
  initialMessage: string | null;
  language: OutputLanguage;
  redirectTo: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const signupHref =
    redirectTo === "/app"
      ? "/signup"
      : `/signup?redirectTo=${encodeURIComponent(redirectTo)}`;
  const forgotPasswordHref = "/forgot-password";
  const verifyHref = `/verify-email?email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(redirectTo)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Login is unavailable in this environment until database-backed auth is configured.",
          "El acceso no está disponible en este entorno hasta que se configure la autenticación con base de datos."
        )
      );
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);
    setEmailDelivery(true);
    setRequiresVerification(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, redirectTo })
      });

      const payload = (await response.json()) as {
        error?: string;
        requiresVerification?: boolean;
        verificationPreviewUrl?: string | null;
        emailDelivery?: boolean;
        deliveryMode?: "email" | "preview_link" | "unavailable";
        redirectTo?: string;
      };

      if (!response.ok) {
        if (payload.requiresVerification) {
          setMessage(
            copyForLanguage(
              language,
              "Verify your email before logging in.",
              "Verifica tu correo antes de iniciar sesión."
            )
          );
          setPreviewUrl(payload.verificationPreviewUrl ?? null);
          setEmailDelivery(payload.emailDelivery ?? true);
          setRequiresVerification(true);
          return;
        }
        throw new Error(
          payload.error ??
            copyForLanguage(language, "Login failed.", "No se pudo iniciar sesión.")
        );
      }

      router.push(payload.redirectTo ?? redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(language, "Login failed.", "No se pudo iniciar sesión.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <InputField
          label={copyForLanguage(language, "Email", "Correo")}
          onChange={setEmail}
          placeholder={copyForLanguage(language, "you@company.com", "tu@empresa.com")}
          type="email"
          value={email}
        />
        <InputField
          label={copyForLanguage(language, "Password", "Contraseña")}
          onChange={setPassword}
          placeholder={copyForLanguage(language, "Your password", "Tu contraseña")}
          type="password"
          value={password}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Logging in...", "Entrando...")
            : copyForLanguage(language, "Log in", "Iniciar sesión")}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <div className="mt-3 space-y-3">
              <p>
                {copyForLanguage(
                  language,
                  "This environment is using a preview verification link instead of live email.",
                  "Este entorno usa un enlace de verificación de vista previa en lugar de correo real."
                )}
              </p>
              <a
                className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sand"
                href={previewUrl}
              >
                {copyForLanguage(language, "Verify email now", "Verificar correo ahora")}
              </a>
            </div>
          ) : !emailDelivery ? (
            <p className="mt-2">
              {copyForLanguage(
                language,
                "This environment cannot deliver a verification step for unverified accounts yet.",
                "Este entorno todavía no puede entregar la verificación para cuentas no verificadas."
              )}
            </p>
          ) : null}
          {requiresVerification ? (
            <p className="mt-3">
              <Link className="font-semibold text-ink underline" href={verifyHref}>
                {copyForLanguage(
                  language,
                  "Open verification help",
                  "Abrir ayuda de verificación"
                )}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm text-muted">
        <Link className="font-semibold text-ink underline" href={forgotPasswordHref}>
          {copyForLanguage(language, "Forgot password?", "¿Olvidaste tu contraseña?")}
        </Link>
        <span>·</span>
        <Link className="font-semibold text-ink underline" href={signupHref}>
          {copyForLanguage(language, "Create account", "Crear cuenta")}
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
