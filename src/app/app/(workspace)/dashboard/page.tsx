import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import {
  getBusinessProfile,
  getLatestActionPlan,
  getLatestBusinessAssets,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  getPlanDefinition,
  isLockedState,
  type BusinessAssetRecord,
  type DiagnosticResultRecord,
  type ThirtyDayPlanRecord
} from "@/lib/foundation";

function formatConfidence(
  confidence: DiagnosticResultRecord["confidence"] | null | undefined
) {
  if (!confidence) {
    return "Not available";
  }

  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

function maturityLabel(score: number | null) {
  if (score === null) {
    return "Not assessed";
  }

  if (score >= 75) {
    return "Execution foundation is forming";
  }

  if (score >= 50) {
    return "Core systems need tightening";
  }

  return "Foundations still need structure";
}

function dashboardBasis(result: DiagnosticResultRecord | null) {
  if (!result) {
    return [];
  }

  return Array.from(
    new Set(
      result.categoryScores.flatMap((item) => item.basedOn ?? []).concat(
        result.evidenceCards.flatMap((item) => item.basedOn ?? [])
      )
    )
  ).slice(0, 6);
}

function assetTypeSummary(assets: BusinessAssetRecord[]) {
  return Array.from(new Set(assets.map((asset) => asset.assetType.replaceAll("_", " ")))).slice(
    0,
    4
  );
}

function nextThirtyDayMoments(plan: ThirtyDayPlanRecord | null) {
  if (!plan) {
    return [];
  }

  return [plan.week1, plan.week2, plan.week3, plan.week4].map((week, index) => ({
    label: `Week ${index + 1}`,
    title: week.objective,
    signal: week.successSignal
  }));
}

function ModuleCard({
  detail,
  href,
  label,
  value
}: {
  detail: string;
  href: string;
  label: string;
  value: string;
}) {
  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      <Link className="mt-4 inline-flex text-sm font-semibold text-ink underline" href={href}>
        Open {label.toLowerCase()}
      </Link>
    </article>
  );
}

export default async function WorkspaceDashboardPage() {
  const context = await requireWorkspaceContext("/app/dashboard");
  const [
    profile,
    latestDiagnostic,
    latestRoadmap,
    latestActionPlan,
    latestThirtyDayPlan,
    latestAssets
  ] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestRoadmap(context.workspace.id),
    getLatestActionPlan(context.workspace.id),
    getLatestThirtyDayPlan(context.workspace.id),
    getLatestBusinessAssets(context.workspace.id)
  ]);
  const plan = getPlanDefinition(context.workspace.plan);
  const maturityScore = latestDiagnostic?.overallMaturityScore ?? null;
  const topGaps = latestDiagnostic?.topBottlenecks.slice(0, 3) ?? [];
  const evidenceBasis = dashboardBasis(latestDiagnostic);
  const thirtyDayMoments = nextThirtyDayMoments(latestThirtyDayPlan);
  const assetTypes = assetTypeSummary(latestAssets);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Workspace dashboard</span>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              A clearer operating snapshot for {context.workspace.name}.
            </h2>
            <p className="mt-4 body-lg">
              This dashboard now surfaces the most useful saved context first:
              current maturity, top gaps, the next 30 days, confidence, and
              what the read is based on.
            </p>
          </div>
          <div className="rounded-[28px] border border-[color:var(--border)] bg-ink p-6 text-sand">
            <p className="text-sm uppercase tracking-[0.18em] text-sand/70">
              Current maturity
            </p>
            <p className="mt-4 text-6xl font-semibold">
              {maturityScore === null ? "--" : maturityScore}
            </p>
            <p className="mt-3 text-sm text-sand/80">{maturityLabel(maturityScore)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pill bg-white/12 text-sand">
                Confidence: {formatConfidence(latestDiagnostic?.confidence)}
              </span>
              <span className="pill bg-white/12 text-sand">{plan.label}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <PageSummaryGrid
            items={[
              {
                label: "Profile",
                value: profile ? "Saved" : "Needs setup",
                detail: profile
                  ? "The guided intake can refine the same saved profile model."
                  : "Complete the guided intake before expecting strong diagnostics."
              },
              {
                label: "Confidence",
                value: formatConfidence(latestDiagnostic?.confidence),
                detail: latestDiagnostic
                  ? "Confidence reflects completeness, consistency, specificity, and evidence quality."
                  : "Confidence appears after the first diagnostic run."
              },
              {
                label: "Top gaps",
                value: String(topGaps.length),
                detail:
                  topGaps.length > 0
                    ? topGaps.map((gap) => gap.title).join(" | ")
                    : "No major gaps surfaced yet."
              },
              {
                label: "Next 30 days",
                value: latestThirtyDayPlan ? "Planned" : "Not planned",
                detail: latestThirtyDayPlan
                  ? latestThirtyDayPlan.monthObjective
                  : "Generate actions and the 30-day plan after diagnostics."
              }
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Top gaps</p>
          <div className="mt-4 grid gap-4">
            {topGaps.length > 0 ? (
              topGaps.map((gap) => (
                <div
                  className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                  key={gap.title}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill bg-coral/10 text-coral">{gap.severity}</span>
                    {gap.basedOn?.map((basis) => (
                      <span className="pill bg-sand text-ink" key={`${gap.title}-${basis}`}>
                        {basis}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{gap.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted">{gap.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 text-sm text-muted">
                Run diagnostics to surface the most pressing execution gaps.
              </div>
            )}
          </div>
        </article>

        <article className="surface p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">What this is based on</p>
          {evidenceBasis.length > 0 ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {evidenceBasis.map((basis) => (
                  <span className="pill bg-white/85 text-ink" key={basis}>
                    {basis}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted">
                This view is grounded in the saved profile and deterministic
                scoring layer. It is not using live telemetry or hidden
                external signals yet.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Evidence basis appears after a diagnostic run saves score drivers
              and visible input references.
            </p>
          )}
        </article>
      </section>

      <section className="surface p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Next 30 days</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {latestThirtyDayPlan
                ? latestThirtyDayPlan.monthObjective
                : "No 30-day plan has been generated yet."}
            </h3>
          </div>
          <Link
            className="inline-flex rounded-[24px] border border-[color:var(--border)] bg-white/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
            href="/app/actions"
          >
            Open actions
          </Link>
        </div>

        {thirtyDayMoments.length > 0 ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {thirtyDayMoments.map((moment) => (
              <article
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                key={moment.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  {moment.label}
                </p>
                <h4 className="mt-3 text-xl font-semibold">{moment.title}</h4>
                <p className="mt-4 text-sm text-muted">
                  <strong className="text-ink">Success signal:</strong> {moment.signal}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 text-sm text-muted">
            Generate actions to turn the diagnostic into a practical weekly plan.
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          detail={profile ? "Saved profile context is available." : "Start the guided intake."}
          href="/app/profile"
          label="Profile"
          value={profile ? "Saved" : "Not started"}
        />
        <ModuleCard
          detail={
            latestDiagnostic
              ? `Latest score ${latestDiagnostic.overallMaturityScore}/100.`
              : "Run the first diagnostic."
          }
          href="/app/diagnostics"
          label="Diagnostics"
          value={latestDiagnostic ? "Saved" : "Not generated"}
        />
        <ModuleCard
          detail={
            latestRoadmap
              ? `${latestRoadmap.items.length} roadmap items are saved.`
              : "Generate a staged roadmap next."
          }
          href="/app/roadmap"
          label="Roadmap"
          value={latestRoadmap ? "Saved" : "Not generated"}
        />
        <ModuleCard
          detail={
            latestActionPlan
              ? `${latestActionPlan.actions.length} action cards are saved.`
              : "Generate actions and a 30-day plan."
          }
          href="/app/actions"
          label="Actions"
          value={latestActionPlan ? "Saved" : "Not generated"}
        />
        <ModuleCard
          detail={
            latestAssets.length > 0
              ? `Saved types: ${assetTypes.join(", ")}.`
              : "Generate preview artifacts after planning."
          }
          href="/app/assets"
          label="Assets"
          value={latestAssets.length > 0 ? `${latestAssets.length} saved` : "Not generated"}
        />
        <ModuleCard
          detail={`Role: ${context.membership.role}. Global role: ${context.user.globalRole.replaceAll("_", " ")}.`}
          href="/app/team"
          label="Team"
          value={context.workspace.slug}
        />
        <ModuleCard
          detail={plan.description}
          href="/app/dashboard"
          label="Plan"
          value={plan.label}
        />
        <ModuleCard
          detail="Support, deletion requests, and pilot operations stay explicit."
          href="/app/support"
          label="Support"
          value="Pilot-ready"
        />
      </section>
    </div>
  );
}
