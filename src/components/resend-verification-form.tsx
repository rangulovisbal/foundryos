"use client";

import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function ResendVerificationForm({
  canSubmit,
  email,
  language,
  redirectTo
}: {
  canSubmit: boolean;
  email: string;
  language: OutputLanguage;
  redirectTo: string;
}) {
  const [currentEmail, setCurrentEmail] = useState(email);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Verification resend is unavailable in this environment.",
          "El reenvío de verificación no está disponible en este entorno."
        )
      );
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: currentEmail,
          redirectTo
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        previewUrl?: string | null;
        emailDelivery?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Verification could not be resent.",
              "No se pudo reenviar la verificación."
            )
        );
      }

      setPreviewUrl(payload.previewUrl ?? null);
      setMessage(
        copyForLanguage(
          language,
          "If the account is still unverified, a new verification step has been prepared.",
          "Si la cuenta sigue sin verificar, se ha preparado un nuevo paso de verificación."
        )
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Verification could not be resent.",
              "No se pudo reenviar la verificación."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-4 text-sm text-muted">
      <p className="font-semibold text-ink">
        {copyForLanguage(
          language,
          "Need another verification link?",
          "¿Necesitas otro enlace de verificación?"
        )}
      </p>
      <form className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
        <input
          className="rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          onChange={(event) => setCurrentEmail(event.target.value)}
          placeholder="you@company.com"
          type="email"
          value={currentEmail}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-sand disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Preparing...", "Preparando...")
            : copyForLanguage(language, "Resend link", "Reenviar enlace")}
        </button>
      </form>

      {message ? <p className="mt-3">{message}</p> : null}
      {previewUrl ? (
        <p className="mt-2">
          <a className="font-semibold text-ink underline" href={previewUrl}>
            {copyForLanguage(
              language,
              "Open verification link",
              "Abrir enlace de verificación"
            )}
          </a>
        </p>
      ) : null}
    </div>
  );
}
