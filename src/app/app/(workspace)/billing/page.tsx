import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  formatAccountStateLabel,
  formatPlanDescription,
  getPlanDefinition,
  isLockedState
} from "@/lib/foundation";
import { copyForLanguage, formatDateForLanguage } from "@/lib/language";

export default async function BillingPage() {
  const context = await requireWorkspaceContext("/app/billing");
  const plan = getPlanDefinition(context.workspace.plan);
  const language = context.workspace.outputLanguage;

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">
          {copyForLanguage(language, "Billing and entitlements", "Facturación y permisos")}
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {copyForLanguage(
            language,
            "Workspace plan state is now enforced internally.",
            "El estado del plan del espacio ahora se controla internamente."
          )}
        </h2>
        <p className="mt-4 body-lg">
          {copyForLanguage(
            language,
            "Live billing is intentionally disabled. This panel shows the preview plan, account state, and stored usage placeholders that the future Stripe integration will control.",
            "La facturación en vivo está desactivada de forma intencional. Este panel muestra el plan piloto, el estado de la cuenta y los contadores guardados que controlará la futura integración con Stripe."
          )}
        </p>
      </section>

      <section className="foundry-card-grid">
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Plan", "Plan")}
          </p>
          <p className="mt-3 text-2xl font-semibold">{plan.label}</p>
          <p className="mt-2 text-sm text-muted">
            {formatPlanDescription(context.workspace.plan, language)}
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Account state", "Estado de la cuenta")}
          </p>
          <p className="mt-3 text-2xl font-semibold capitalize">
            {formatAccountStateLabel(context.workspace.accountState, language)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Internal admin can change this for test coverage.",
              "El admin interno puede cambiarlo para cubrir pruebas."
            )}
          </p>
        </article>
        {context.usage.map((item) => (
          <article className="metric-card" key={item.metricKey}>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              {item.metricKey.replaceAll("_", " ")}
            </p>
            <p className="mt-3 text-2xl font-semibold">
              {item.usedCount}/{item.limitCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              {copyForLanguage(language, "Period ends", "El periodo termina")}{" "}
              {formatDateForLanguage(language, item.periodEnd)}
              .
            </p>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          {copyForLanguage(language, "Feature access", "Acceso a funciones")}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(plan.features).map(([feature, enabled]) => (
            <div
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-4 py-4 text-sm text-muted"
              key={feature}
            >
              <p className="font-semibold capitalize text-ink">
                {feature.replaceAll("_", " ")}
              </p>
              <p className="mt-2">
                {enabled
                  ? copyForLanguage(language, "Enabled in preview", "Disponible en piloto")
                  : copyForLanguage(language, "Disabled on this plan", "No disponible en este plan")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
