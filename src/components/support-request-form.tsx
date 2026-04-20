"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formatSupportIssueType,
  supportIssueTypeOptions,
  type OutputLanguage,
  type SupportIssueType
} from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function SupportRequestForm({
  canSubmit,
  language
}: {
  canSubmit: boolean;
  language: OutputLanguage;
}) {
  const router = useRouter();
  const [issueType, setIssueType] = useState<SupportIssueType>("product_question");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/app/support/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ issueType, message })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(
              language,
              "Support request failed.",
              "No se pudo enviar la solicitud de soporte."
            )
        );
      }

      setFeedbackTone("success");
      setFeedback(
        copyForLanguage(
          language,
          "Support request submitted. This pilot still uses manual founder or internal-admin follow-up.",
          "Solicitud de soporte enviada. Este piloto todavía usa seguimiento manual del fundador o del admin interno."
        )
      );
      setMessage("");
      setIssueType("product_question");
      router.refresh();
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : copyForLanguage(
              language,
              "Support request failed.",
              "No se pudo enviar la solicitud de soporte."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
        {copyForLanguage(language, "Contact support", "Contactar soporte")}
      </p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <select
          className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canSubmit || loading}
          onChange={(event) => setIssueType(event.target.value as SupportIssueType)}
          value={issueType}
        >
          {supportIssueTypeOptions.map((option) => (
            <option key={option} value={option}>
              {formatSupportIssueType(option, language)}
            </option>
          ))}
        </select>
        <textarea
          className="min-h-[180px] w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
          disabled={!canSubmit || loading}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={copyForLanguage(
            language,
            "Describe the issue, the route or module involved, what you expected, and what actually happened.",
            "Describe el problema, la ruta o módulo implicado, qué esperabas y qué ocurrió realmente."
          )}
          value={message}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Submitting...", "Enviando...")
            : copyForLanguage(language, "Submit support request", "Enviar solicitud de soporte")}
        </button>
      </form>
      {feedback ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedbackTone === "success"
              ? "border-teal/30 bg-teal/10 text-teal"
              : "border-coral/30 bg-coral/10 text-coral"
          }`}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
