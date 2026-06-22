import { CheckoutButton } from "@/components/checkout-button";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  formatAccountStateLabel,
  formatPlanDescription,
  getPlanDefinition,
  isLockedState
} from "@/lib/foundation";
import { copyForLanguage, formatDateForLanguage } from "@/lib/language";
import { isPlanCheckoutConfigured, pricingPlans } from "@/lib/pricing";

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
            "Workspace plan state and checkout are connected to billing.",
            "El estado del plan y el checkout están conectados a facturación."
          )}
        </h2>
        <p className="mt-4 body-lg">
          {copyForLanguage(
            language,
            "When Stripe checkout is enabled for this deployment, paid subscriptions start from this workspace so the webhook can update plan and account state.",
            "Cuando Stripe checkout está activo en este despliegue, las suscripciones de pago empiezan desde este espacio para que el webhook pueda actualizar el plan y el estado de la cuenta."
          )}
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {pricingPlans
          .filter((item) => item.id !== "snapshot")
          .map((item) => (
            <article className="surface p-6" key={item.id}>
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                {item.cadence}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{item.name}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
              <div className="mt-5">
                {isPlanCheckoutConfigured(item.id) ? (
                  <CheckoutButton planId={item.id}>{item.ctaLabel}</CheckoutButton>
                ) : (
                  <p className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
                    {copyForLanguage(
                      language,
                      "Checkout price is not configured for this plan in the current environment.",
                      "El precio de checkout no está configurado para este plan en el entorno actual."
                    )}
                  </p>
                )}
              </div>
            </article>
          ))}
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
