"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

// The agentic diagnosis runs two Claude Fable 5 passes (draft + review) and
// regularly takes 2-3 minutes in production. The route's own maxDuration is
// 300s; give the client a little more headroom so the server's own timeout
// error (rather than an early client abort) is what surfaces on genuine
// timeouts.
const CLIENT_TIMEOUT_MS = 320_000;

type PhaseCopy = { atSeconds: number; en: string; es: string };

const PHASES: PhaseCopy[] = [
  {
    atSeconds: 0,
    en: "Starting the diagnosis...",
    es: "Iniciando el diagnóstico..."
  },
  {
    atSeconds: 10,
    en: "Reading your website and profile...",
    es: "Leyendo tu web y tu perfil..."
  },
  {
    atSeconds: 35,
    en: "Analyzing the 7 marketing dimensions...",
    es: "Analizando las 7 dimensiones de marketing..."
  },
  {
    atSeconds: 70,
    en: "Building your 30-day plan and ready-to-use assets...",
    es: "Construyendo tu plan de 30 días y tus activos listos para usar..."
  },
  {
    atSeconds: 110,
    en: "Reviewing the diagnosis before delivering it...",
    es: "Revisando el diagnóstico antes de entregarlo..."
  },
  {
    atSeconds: 170,
    en: "This is taking longer than usual, but we're still working on it...",
    es: "Esto está tardando más de lo habitual, pero seguimos trabajando..."
  }
];

function phaseForElapsed(seconds: number, language: OutputLanguage) {
  const phase =
    [...PHASES].reverse().find((entry) => seconds >= entry.atSeconds) ?? PHASES[0];
  return copyForLanguage(language, phase.en, phase.es);
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
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
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading) {
      return;
    }

    setElapsedSeconds(0);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  async function handleRun() {
    if (loading) {
      return;
    }

    if (!canRun) {
      setMessageTone("error");
      setMessage(disabledReason);
      return;
    }

    setLoading(true);
    setMessage(null);

    const controller = new AbortController();
    controllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/diagnosis", {
        method: "POST",
        signal: controller.signal
      });

      let payload: {
        error?: string;
        source?: "anthropic" | "deterministic_fallback";
      } = {};

      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const fallbackMessage =
          response.status === 504 || response.status === 408
            ? copyForLanguage(
                language,
                "The diagnosis took too long to finish and timed out. Please try again.",
                "El diagnóstico tardó demasiado y no terminó a tiempo. Inténtalo de nuevo."
              )
            : copyForLanguage(
                language,
                "Marketing diagnosis failed.",
                "El diagnóstico de marketing falló."
              );

        throw new Error(payload.error ?? fallbackMessage);
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
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage(
          copyForLanguage(
            language,
            "The diagnosis took too long to finish and timed out. Please try again.",
            "El diagnóstico tardó demasiado y no terminó a tiempo. Inténtalo de nuevo."
          )
        );
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : copyForLanguage(
                language,
                "Marketing diagnosis failed.",
                "El diagnóstico de marketing falló."
              )
        );
      }
    } finally {
      clearTimeout(timeoutId);
      controllerRef.current = null;
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="inline-flex items-center gap-2 rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || !canRun}
        onClick={handleRun}
        type="button"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading
          ? copyForLanguage(language, "Running marketing diagnosis...", "Ejecutando diagnóstico de marketing...")
          : copyForLanguage(language, "Run marketing diagnosis", "Ejecutar diagnóstico de marketing")}
      </button>

      {!canRun && !loading ? <p className="text-sm text-muted">{disabledReason}</p> : null}

      {loading ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted"
        >
          <p>{phaseForElapsed(elapsedSeconds, language)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted/80">
            {copyForLanguage(language, "Elapsed", "Transcurrido")}: {formatElapsed(elapsedSeconds)}
          </p>
        </div>
      ) : null}

      {!loading && message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            messageTone === "success"
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-coral/30 bg-coral/10 text-coral"
          }`}
        >
          <p>{message}</p>
          {messageTone === "error" && canRun ? (
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-[18px] border border-coral/30 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-coral"
              onClick={handleRun}
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {copyForLanguage(language, "Retry", "Reintentar")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
