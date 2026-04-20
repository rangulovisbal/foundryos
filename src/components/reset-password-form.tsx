"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function ResetPasswordForm({
  canSubmit,
  language,
  token
}: {
  canSubmit: boolean;
  language: OutputLanguage;
  token: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Password reset is unavailable in this environment until database-backed auth is configured.",
          "El restablecimiento de contraseña no está disponible en este entorno hasta que se configure la autenticación con base de datos."
        )
      );
      return;
    }

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
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Password reset failed.",
              "No se pudo restablecer la contraseña."
            )
        );
      }

      setMessage(
        copyForLanguage(
          language,
          "Password updated. Redirecting to login...",
          "Contraseña actualizada. Redirigiendo al acceso..."
        )
      );
      setTimeout(() => {
        router.push("/login?reset=1");
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Password reset failed.",
              "No se pudo restablecer la contraseña."
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
          <span>{copyForLanguage(language, "New password", "Nueva contraseña")}</span>
          <input
            className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copyForLanguage(
              language,
              "Minimum 10 characters",
              "Mínimo 10 caracteres"
            )}
            type="password"
            value={password}
          />
        </label>
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Saving...", "Guardando...")
            : copyForLanguage(language, "Update password", "Actualizar contraseña")}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          {message}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        <Link className="font-semibold text-ink underline" href="/login">
          {copyForLanguage(language, "Return to login", "Volver al acceso")}
        </Link>
      </p>
    </div>
  );
}
