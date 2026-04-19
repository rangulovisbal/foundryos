import Link from "next/link";

import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { PlanningGenerateButton } from "@/components/planning-generate-button";
import {
  getBusinessProfile,
  getLatestActionPlan,
  getLatestDiagnosticResult,
  getLatestThirtyDayPlan,
  listPlanningJobsWithArtifacts
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canGenerateThirtyDayPlan,
  isLockedState,
  isReadOnlyState,
  type ActionPlanRecord,
  type PlanActionItem,
  type PlanningJobWithArtifacts,
  type ThirtyDayPlanRecord,
  type ThirtyDayPlanWeek
} from "@/lib/foundation";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  hasDiagnostic: boolean
) {
  if (!hasProfile) {
    return "Complete and save the business profile before generating actions.";
  }

  if (!hasDiagnostic) {
    return "Run diagnostics before generating actions and a 30-day plan.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "Actions and 30-day plan generation are locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "Actions and 30-day plan generation are read-only while this workspace account state is limited.";
  }

  if (!canGenerateThirtyDayPlan(context)) {
    return "Only workspace owners and admins can generate actions in this MVP.";
  }

  return "Actions and 30-day plan generation are unavailable.";
}

function formatOutputLanguageLabel(language: "en" | "es") {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function ActionsPage() {
  const context = await requireWorkspaceContext("/app/actions");
  const [profile, latestDiagnostic, latestActionPlan, latestThirtyDayPlan, history] =
    await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestActionPlan(context.workspace.id),
      getLatestThirtyDayPlan(context.workspace.id),
      listPlanningJobsWithArtifacts({
        workspaceId: context.workspace.id,
        jobType: "thirty_day_plan_generation",
        limit: 10
      })
    ]);
  const canGenerate =
    canGenerateThirtyDayPlan(context) && Boolean(profile) && Boolean(latestDiagnostic);
  const disabledReason = resolveDisabledReason(
    context,
    Boolean(profile),
    Boolean(latestDiagnostic)
  );

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Actions and 30-day plan</span>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              Convert diagnostics into executable operating work.
            </h2>
            <p className="mt-4 body-lg">
              The action layer stores owner suggestions, priorities, reasoning,
              and a 30-day plan without claiming live delivery or billing
              automation.
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Latest plan
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {latestThirtyDayPlan ? "Saved" : "Missing"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {latestThirtyDayPlan
                ? new Date(latestThirtyDayPlan.createdAt).toLocaleString()
                : "Generate after diagnostics."}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PlanningGenerateButton
            canGenerate={canGenerate}
            disabledReason={disabledReason}
            endpoint="/api/app/actions/generate"
            idleLabel="Generate actions"
            loadingLabel="Generating plan..."
            successLabel="Actions and 30-day plan generated and saved."
          />
        </div>
        <div className="mt-6 space-y-4">
          <PageSummaryGrid
            items={[
              {
                label: "Action cards",
                value: String(latestActionPlan?.actions.length ?? 0),
                detail: latestActionPlan
                  ? "Saved action list from the latest planning run."
                  : "No persisted action list yet."
              },
              {
                label: "30-day plan",
                value: latestThirtyDayPlan ? "Saved" : "Missing",
                detail: latestThirtyDayPlan
                  ? latestThirtyDayPlan.monthObjective
                  : "Generate after diagnostics."
              },
              {
                label: "Quick wins",
                value: String(latestThirtyDayPlan?.quickWins.length ?? 0),
                detail: "Fast execution items surfaced from the latest plan."
              },
              {
                label: "Output language",
                value: formatOutputLanguageLabel(context.workspace.outputLanguage),
                detail: "UI stays in English while generated planning follows the workspace setting."
              }
            ]}
          />
          <PageSectionLinks
            links={[
              ...(latestActionPlan ? [{ href: "#action-list", label: "Action list" }] : []),
              ...(latestThirtyDayPlan
                ? [{ href: "#thirty-day-plan", label: "30-day plan" }]
                : []),
              { href: "#action-history", label: "History" }
            ]}
          />
        </div>
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestActionPlan ? (
        <ActionPlanSection actionPlan={latestActionPlan} />
      ) : (
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">No actions yet</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Generate actions after diagnostics are complete.
          </h2>
          <p className="mt-4 body-lg">
            Actions are persisted as structured cards so they can later become
            status-tracked work without changing the public preview.
          </p>
        </section>
      )}

      {latestThirtyDayPlan ? (
        <ThirtyDayPlanSection plan={latestThirtyDayPlan} />
      ) : null}

      <PlanningHistoryTable history={history} />
    </div>
  );
}

function PrerequisitePanel({
  hasDiagnostic,
  hasProfile
}: {
  hasDiagnostic: boolean;
  hasProfile: boolean;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        Actions need profile and diagnostic inputs.
      </h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {!hasProfile ? (
          <Link
            className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
            href="/app/profile"
          >
            Complete profile
          </Link>
        ) : null}
        {!hasDiagnostic ? (
          <Link
            className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
            href="/app/diagnostics"
          >
            Run diagnostics
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function ActionPlanSection({ actionPlan }: { actionPlan: ActionPlanRecord }) {
  return (
    <section className="surface p-6 md:p-8" id="action-list">
      <span className="eyebrow">Action list</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        Prioritized actions from the latest planning run.
      </h2>
      <p className="mt-4 text-sm text-muted">
        Saved {new Date(actionPlan.createdAt).toLocaleString()}
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {actionPlan.actions.map((action) => (
          <ActionCard action={action} key={`${action.priority}-${action.title}`} />
        ))}
      </div>
    </section>
  );
}

function ActionCard({ action }: { action: PlanActionItem }) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {action.priority} priority
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {action.status.replaceAll("_", " ")}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{action.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{action.description}</p>
      <div className="mt-4 grid gap-2 text-sm text-muted">
        <p>
          <strong className="text-ink">Owner:</strong> {action.ownerSuggestion}
        </p>
        <p>
          <strong className="text-ink">Category:</strong> {action.linkedCategory}
        </p>
        <p>
          <strong className="text-ink">Reasoning:</strong> {action.linkedReasoning}
        </p>
      </div>
    </article>
  );
}

function ThirtyDayPlanSection({ plan }: { plan: ThirtyDayPlanRecord }) {
  return (
    <section className="space-y-6" id="thirty-day-plan">
      <div className="surface p-6 md:p-8">
        <span className="eyebrow">30-day plan</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {plan.monthObjective}
        </h2>
        <p className="mt-4 text-sm text-muted">
          Saved {new Date(plan.createdAt).toLocaleString()}
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Top 3 priorities" values={plan.topPriorities} />
        <ListCard title="Quick wins" values={plan.quickWins} />
        <ListCard title="Risks to avoid" values={plan.risksToAvoid} />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <WeekCard week={plan.week1} />
        <WeekCard week={plan.week2} />
        <WeekCard week={plan.week3} />
        <WeekCard week={plan.week4} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ListCard title="Success signals" values={plan.successSignals} />
        <ListCard title="Metrics to watch" values={plan.metricsToWatch} />
      </section>
    </section>
  );
}

function WeekCard({ week }: { week: ThirtyDayPlanWeek }) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{week.title}</p>
      <h3 className="mt-3 text-xl font-semibold">{week.objective}</h3>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
        {week.actions.map((action) => (
          <li key={action}>- {action}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        <strong className="text-ink">Signal:</strong> {week.successSignal}
      </p>
    </article>
  );
}

function ListCard({ title, values }: { title: string; values: string[] }) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-muted">
        {values.map((value) => (
          <li key={value}>- {value}</li>
        ))}
      </ul>
    </article>
  );
}

function PlanningHistoryTable({ history }: { history: PlanningJobWithArtifacts[] }) {
  return (
    <details className="surface overflow-hidden" id="action-history">
      <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          Generation history
        </p>
        <p className="mt-2 text-sm text-muted">
          Expand to review earlier action and 30-day plan runs.
        </p>
      </summary>
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
                <th className="px-4 py-3 font-semibold">30-day plan</th>
                <th className="px-4 py-3 font-semibold">Error</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((entry) => (
                  <tr key={entry.job.id} className="border-t border-[color:var(--border)]">
                    <td className="px-4 py-4 text-muted">
                      {new Date(entry.job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 capitalize">{entry.job.status}</td>
                    <td className="px-4 py-4">{entry.actionPlan ? "saved" : "n/a"}</td>
                    <td className="px-4 py-4">
                      {entry.thirtyDayPlan ? "saved" : "n/a"}
                    </td>
                    <td className="px-4 py-4 text-muted">{entry.job.error ?? "none"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    No 30-day plan generation jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
