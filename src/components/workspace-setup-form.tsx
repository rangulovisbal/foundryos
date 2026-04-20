"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function WorkspaceSetupForm({
  canSubmit,
  language
}: {
  canSubmit: boolean;
  language: OutputLanguage;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Workspace creation is unavailable until database-backed auth is configured.",
          "La creación del espacio no está disponible hasta que se configure la autenticación con base de datos."
        )
      );
      return;
    }

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
          language,
          plan: "growth-os"
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Workspace creation failed.",
              "No se pudo crear el espacio."
            )
        );
      }

      router.push("/app/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Workspace creation failed.",
              "No se pudo crear el espacio."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="space-y-2 text-sm font-medium">
        <span>{copyForLanguage(language, "Workspace name", "Nombre del espacio")}</span>
        <input
          className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          onChange={(event) => setName(event.target.value)}
          placeholder={copyForLanguage(language, "FoundryOS Studio", "FoundryOS Studio")}
          value={name}
        />
      </label>

      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
        {copyForLanguage(
          language,
          "This creates one FoundryOS Core trial workspace for pilot use. Live billing and automated plan provisioning are still disabled.",
          "Esto crea un espacio FoundryOS Core en prueba para uso piloto. La facturación en vivo y el aprovisionamiento automático del plan siguen desactivados."
        )}
      </div>

      <button
        className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
        disabled={!canSubmit || loading}
        type="submit"
      >
        {loading
          ? copyForLanguage(language, "Creating workspace...", "Creando espacio...")
          : copyForLanguage(language, "Create workspace", "Crear espacio")}
      </button>

      {message ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {message}
        </div>
      ) : null}
    </form>
  );
}
