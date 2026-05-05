"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function DiagnosticsRunButton({
  canRun,
  disabledReason,
  language
}: {
  canRun: boolean;
  disabledReason: string;
  language: OutputLanguage;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    if (!canRun) {
      setMessageTone("error");
      setMessage(disabledReason);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/app/diagnostics/run", {
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(language, "Marketing diagnosis failed.", "El diagnóstico de marketing falló.")
        );
      }

      setMessageTone("success");
      setMessage(
        copyForLanguage(
          language,
          "Marketing diagnosis completed and saved.",
          "El diagnóstico de marketing se completó y quedó guardado."
        )
      );
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : copyForLanguage(language, "Marketing diagnosis failed.", "El diagnóstico de marketing falló.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
        disabled={loading}
        onClick={handleRun}
        type="button"
      >
        {loading
          ? copyForLanguage(language, "Running marketing diagnosis...", "Ejecutando diagnóstico de marketing...")
          : copyForLanguage(language, "Run marketing diagnosis", "Ejecutar diagnóstico de marketing")}
      </button>
      {!canRun ? <p className="text-sm text-muted">{disabledReason}</p> : null}
      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-coral/30 bg-coral/10 text-coral"
          }`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
