"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

const EXPECTED_RUN_SECONDS = 180;

function stageCopy(language: OutputLanguage, elapsedSeconds: number): string {
  if (elapsedSeconds < 25) {
    return copyForLanguage(
      language,
      "Reading your profile and website evidence...",
      "Leyendo tu perfil y la evidencia de tu sitio..."
    );
  }
  if (elapsedSeconds < 110) {
    return copyForLanguage(
      language,
      "Drafting your marketing diagnosis...",
      "Redactando tu diagnóstico de marketing..."
    );
  }
  return copyForLanguage(
    language,
    "Reviewing quality before saving...",
    "Revisando la calidad antes de guardar..."
  );
}

function formatElapsed(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!loading) {
      return;
    }
    setElapsedSeconds(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [loading]);

  async function handleRun() {
    if (!canRun) {
      setMessageTone("error");
      setMessage(disabledReason);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/diagnosis", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        source?: "anthropic" | "deterministic_fallback";
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(language, "Marketing diagnosis failed.", "El diagnóstico de marketing falló.")
        );
      }

      setMessageTone("success");
      setMessage(
        payload.source === "deterministic_fallback"
          ? copyForLanguage(
              language,
              "Marketing diagnosis completed with the FoundryOS fallback and saved.",
              "El diagnóstico de marketing se completó con el fallback de FoundryOS y quedó guardado."
            )
          : copyForLanguage(
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
      {loading ? (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm text-white/80">
            <span>{stageCopy(language, elapsedSeconds)}</span>
            <span className="tabular-nums">{formatElapsed(elapsedSeconds)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-sand transition-[width] duration-1000 ease-linear"
              style={{
                width: `${Math.min(95, Math.round((elapsedSeconds / EXPECTED_RUN_SECONDS) * 100))}%`
              }}
            />
          </div>
          <p className="text-xs text-white/55">
            {copyForLanguage(
              language,
              "This usually takes 2-3 minutes. Keep this tab open.",
              "Esto suele tardar 2-3 minutos. Mantén esta pestaña abierta."
            )}
          </p>
        </div>
      ) : null}
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
