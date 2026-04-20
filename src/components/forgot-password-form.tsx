"use client";

import Link from "next/link";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function ForgotPasswordForm({
  canSubmit,
  language
}: {
  canSubmit: boolean;
  language: OutputLanguage;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState<"email" | "preview_link" | "unavailable">(
    "email"
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Password recovery is unavailable here until a reset link can be delivered.",
          "La recuperación de contraseña no está disponible aquí hasta que se pueda entregar un enlace de restablecimiento."
        )
      );
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);
    setEmailDelivery(true);
    setDeliveryMode("email");

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
        deliveryMode?: "email" | "preview_link" | "unavailable";
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Reset request failed.",
              "No se pudo preparar el restablecimiento."
            )
        );
      }

      setMessage(
        copyForLanguage(
          language,
          "If the account exists, a reset step has been prepared.",
          "Si la cuenta existe, se ha preparado un paso de restablecimiento."
        )
      );
      setPreviewUrl(payload.previewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);
      setDeliveryMode(payload.deliveryMode ?? "email");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Reset request failed.",
              "No se pudo preparar el restablecimiento."
            )
      );
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
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Preparing reset...", "Preparando restablecimiento...")
            : copyForLanguage(language, "Send reset link", "Enviar enlace de restablecimiento")}
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
                  "This environment is using a preview reset link instead of live email.",
                  "Este entorno usa un enlace de restablecimiento de vista previa en lugar de correo real."
                )}
              </p>
              <a
                className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sand"
                href={previewUrl}
              >
                {copyForLanguage(
                  language,
                  "Reset password now",
                  "Restablecer contraseña ahora"
                )}
              </a>
            </div>
          ) : deliveryMode === "unavailable" && !emailDelivery ? (
            <p className="mt-2">
              {copyForLanguage(
                language,
                "This environment cannot deliver password reset steps yet.",
                "Este entorno todavía no puede entregar pasos de restablecimiento."
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {!canSubmit ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {copyForLanguage(
            language,
            "Password recovery is disabled here until email delivery or preview links are configured.",
            "La recuperación de contraseña está deshabilitada aquí hasta que se configure el correo o los enlaces de vista previa."
          )}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        {copyForLanguage(language, "Remembered it?", "¿La recordaste?")}{" "}
        <Link className="font-semibold text-ink underline" href="/login">
          {copyForLanguage(language, "Go back to login", "Volver al acceso")}
        </Link>
      </p>
    </div>
  );
}
