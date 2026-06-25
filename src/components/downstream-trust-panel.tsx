import type { OutputLanguage } from "@/lib/foundation";
import {
  downstreamTrustBadge,
  type DownstreamTrustState
} from "@/lib/downstream-trust";

function sl(language: OutputLanguage, en: string, es: string) {
  return language === "es" ? es : en;
}

export function DownstreamTrustPanel({
  language,
  state
}: {
  language: OutputLanguage;
  state: DownstreamTrustState | null;
}) {
  if (!state) return null;

  const validationFirst = state.mode === "validation_first";
  const details = validationFirst ? state.validationTasks : state.evidenceGaps;
  const detailLabel = validationFirst
    ? sl(language, "Next best moves", "Siguientes pasos claros")
    : sl(language, "Evidence basis", "Base de evidencia");

  return (
    <section
      className={`rounded-[28px] border p-5 shadow-[0_18px_45px_-34px_rgba(5,26,36,0.55)] md:p-6 ${
        validationFirst
          ? "border-amber-200 bg-amber-50/85"
          : "border-[color:var(--border)] bg-white/85"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            validationFirst
              ? "border-amber-300 bg-white/70 text-amber-900"
              : "border-[color:var(--border)] bg-sand/70 text-muted"
          }`}
        >
          {downstreamTrustBadge(state, language)}
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {sl(language, "Confidence", "Confianza")}: {state.confidence}
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
        {validationFirst
          ? sl(language, "Best read and next move", "Mejor lectura y siguiente paso")
          : sl(language, "Confidence for this output", "Confianza de este resultado")}
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">{state.summary}</p>
      {details.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            {detailLabel}
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-7 text-muted md:grid-cols-2">
            {details.slice(0, 4).map((item) => (
              <li
                className="rounded-[18px] border border-[color:var(--border)] bg-white/70 px-4 py-3"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
