import { LockedStatePanel } from "@/components/locked-state-panel";
import { requireWorkspaceContext } from "@/lib/auth";
import { getPlanDefinition, isLockedState } from "@/lib/foundation";

export default async function WorkspaceDashboardPage() {
  const context = await requireWorkspaceContext("/app/dashboard");
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Workspace dashboard</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Auth, membership, and entitlement foundation is now active.
        </h2>
        <p className="mt-4 body-lg">
          This dashboard confirms the authenticated product shell is working. It
          is intentionally focused on access control, workspace state, and plan
          boundaries before deeper diagnostic modules are moved under /app.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Workspace</p>
          <p className="mt-3 text-2xl font-semibold">{context.workspace.name}</p>
          <p className="mt-2 text-sm text-muted">{context.workspace.slug}</p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Plan</p>
          <p className="mt-3 text-2xl font-semibold">{plan.label}</p>
          <p className="mt-2 text-sm text-muted">{plan.description}</p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Role</p>
          <p className="mt-3 text-2xl font-semibold capitalize">
            {context.membership.role}
          </p>
          <p className="mt-2 text-sm text-muted">
            Global role: {context.user.globalRole.replaceAll("_", " ")}
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Seats</p>
          <p className="mt-3 text-2xl font-semibold">
            {context.usage.find((item) => item.metricKey === "seats")?.usedCount ?? 0}
            /
            {context.usage.find((item) => item.metricKey === "seats")?.limitCount ?? 0}
          </p>
          <p className="mt-2 text-sm text-muted">
            Usage placeholders are stored even before live billing is enabled.
          </p>
        </article>
      </section>
    </div>
  );
}
