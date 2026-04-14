import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import { getPlanDefinition, isLockedState } from "@/lib/foundation";

export default async function BillingPage() {
  const context = await requireWorkspaceContext("/app/billing");
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Billing and entitlements</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Workspace plan state is now enforced internally.
        </h2>
        <p className="mt-4 body-lg">
          Live billing is intentionally disabled. This panel shows the preview
          plan, account state, and stored usage placeholders that the future
          Stripe integration will control.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Plan</p>
          <p className="mt-3 text-2xl font-semibold">{plan.label}</p>
          <p className="mt-2 text-sm text-muted">{plan.description}</p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Account state</p>
          <p className="mt-3 text-2xl font-semibold capitalize">
            {context.workspace.accountState.replaceAll("_", " ")}
          </p>
          <p className="mt-2 text-sm text-muted">
            Internal admin can change this for test coverage.
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
              Period ends {new Date(item.periodEnd).toLocaleDateString()}.
            </p>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Feature access</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Object.entries(plan.features).map(([feature, enabled]) => (
            <div
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-4 py-4 text-sm text-muted"
              key={feature}
            >
              <p className="font-semibold capitalize text-ink">
                {feature.replaceAll("_", " ")}
              </p>
              <p className="mt-2">{enabled ? "Enabled in preview" : "Disabled on this plan"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
