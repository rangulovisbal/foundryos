import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import {
  getBusinessProfile,
  getLatestActionPlan,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import { getPlanDefinition, isLockedState } from "@/lib/foundation";

export default async function WorkspaceDashboardPage() {
  const context = await requireWorkspaceContext("/app/dashboard");
  const [
    profile,
    latestDiagnostic,
    latestRoadmap,
    latestActionPlan,
    latestThirtyDayPlan
  ] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestRoadmap(context.workspace.id),
    getLatestActionPlan(context.workspace.id),
    getLatestThirtyDayPlan(context.workspace.id)
  ]);
  const plan = getPlanDefinition(context.workspace.plan);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Workspace dashboard</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          FoundryOS workspace foundation is active.
        </h2>
        <p className="mt-4 body-lg">
          This dashboard now sits on top of authenticated workspace access,
          role-aware operations, business profile context, and persisted
          diagnostics history.
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
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Profile
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {profile ? "Saved" : "Not started"}
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link className="font-semibold text-ink underline" href="/app/profile">
              Open business profile
            </Link>
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Diagnostics
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {latestDiagnostic
              ? `${latestDiagnostic.overallMaturityScore}/100`
              : "No run yet"}
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link className="font-semibold text-ink underline" href="/app/diagnostics">
              Open diagnostics
            </Link>
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Roadmap</p>
          <p className="mt-3 text-2xl font-semibold">
            {latestRoadmap ? "Saved" : "Not generated"}
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link className="font-semibold text-ink underline" href="/app/roadmap">
              Open roadmap
            </Link>
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Actions</p>
          <p className="mt-3 text-2xl font-semibold">
            {latestActionPlan
              ? `${latestActionPlan.actions.length} saved`
              : "Not generated"}
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link className="font-semibold text-ink underline" href="/app/actions">
              Open actions
            </Link>
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            30-day plan
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {latestThirtyDayPlan ? "Saved" : "Not generated"}
          </p>
          <p className="mt-2 text-sm text-muted">
            Planning is preview-only until live billing and delivery operations
            are intentionally enabled.
          </p>
        </article>
      </section>
    </div>
  );
}
