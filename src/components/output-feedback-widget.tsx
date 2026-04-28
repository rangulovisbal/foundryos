"use client";

import { useCallback, useState } from "react";

type FeedbackLabel = "useful" | "partial" | "generic";

const LABELS: { value: FeedbackLabel; en: string; es: string }[] = [
  { value: "useful", en: "Useful", es: "Útil" },
  { value: "partial", en: "Partial", es: "Parcial" },
  { value: "generic", en: "Generic", es: "Genérico" }
];

export function OutputFeedbackWidget({
  workspaceId,
  moduleType,
  outputId,
  language
}: {
  workspaceId: string;
  moduleType: string;
  outputId: string | null;
  language: "en" | "es";
}) {
  const [selected, setSelected] = useState<FeedbackLabel | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = useCallback(async () => {
    if (!selected) return;
    setState("submitting");
    try {
      const res = await fetch("/api/app/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          module_type: moduleType,
          output_id: outputId,
          label: selected,
          note: note.trim() || null
        })
      });
      if (res.ok) {
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }, [selected, note, workspaceId, moduleType, outputId]);

  if (state === "done") {
    return (
      <section className="surface p-5 md:p-7">
        <p className="text-sm font-semibold text-ink">
          {language === "es" ? "Feedback guardado. Gracias." : "Feedback saved. Thank you."}
        </p>
      </section>
    );
  }

  return (
    <section className="surface p-5 md:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {language === "es" ? "Feedback del piloto" : "Pilot feedback"}
      </p>
      <p className="mt-2 text-sm leading-7 text-muted">
        {language === "es"
          ? "¿Cómo de útil fue este output para tu negocio?"
          : "How useful was this output for your business?"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LABELS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSelected(item.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              selected === item.value
                ? item.value === "useful"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : item.value === "partial"
                    ? "border-amber-400 bg-amber-50 text-amber-800"
                    : "border-rose-400 bg-rose-50 text-rose-800"
                : "border-[color:var(--border)] bg-white/80 text-ink hover:bg-sand/60"
            }`}
          >
            {language === "es" ? item.es : item.en}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              language === "es"
                ? "Nota opcional: ¿qué cambiarías o qué falta?"
                : "Optional note: what would you change or what's missing?"
            }
            rows={3}
            className="w-full rounded-[16px] border border-[color:var(--border)] bg-white/90 px-4 py-3 text-sm text-ink placeholder:text-muted/50 focus:border-ink/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={state === "submitting"}
            className="rounded-[24px] bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-50"
          >
            {state === "submitting"
              ? language === "es"
                ? "Guardando..."
                : "Saving..."
              : language === "es"
                ? "Guardar feedback"
                : "Save feedback"}
          </button>
          {state === "error" ? (
            <p className="text-sm text-rose-600">
              {language === "es"
                ? "Error al guardar. Inténtalo de nuevo."
                : "Failed to save. Please try again."}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
