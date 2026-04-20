"use client";

import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function TeamInviteForm({
  canInvite,
  language
}: {
  canInvite: boolean;
  language: OutputLanguage;
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
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Invitation failed.",
              "No se pudo crear la invitación."
            )
        );
      }

      setMessage(
        copyForLanguage(
          language,
          "Invitation created for pilot use.",
          "Invitación creada para uso piloto."
        )
      );
      setPreviewUrl(payload.previewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);
      setEmail("");
      setRole("member");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Invitation failed.",
              "No se pudo crear la invitación."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        {copyForLanguage(language, "Invite member", "Invitar miembro")}
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
          <option value="admin">{copyForLanguage(language, "Admin", "Admin")}</option>
          <option value="member">{copyForLanguage(language, "Member", "Miembro")}</option>
          <option value="viewer">{copyForLanguage(language, "Viewer", "Lector")}</option>
        </select>
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canInvite || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Inviting...", "Invitando...")
            : copyForLanguage(language, "Send invite", "Enviar invitación")}
        </button>
      </form>
      {!canInvite ? (
        <p className="mt-3 text-sm text-muted">
          {copyForLanguage(
            language,
            "Invites are disabled for your role, current account state, or current pilot plan.",
            "Las invitaciones están desactivadas para tu rol, el estado actual de la cuenta o el plan piloto actual."
          )}
        </p>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <p className="mt-2">
              {copyForLanguage(language, "Preview invite link:", "Enlace de invitación de vista previa:")}{" "}
              <a className="font-semibold text-ink underline" href={previewUrl}>
                {copyForLanguage(language, "accept invitation", "aceptar invitación")}
              </a>
            </p>
          ) : !emailDelivery ? (
            <p className="mt-2">
              {copyForLanguage(
                language,
                "Invitation delivery is unavailable in this environment. Use preview links or a configured email environment before relying on invites.",
                "La entrega de invitaciones no está disponible en este entorno. Usa enlaces de vista previa o un entorno con correo configurado antes de depender de las invitaciones."
              )}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
