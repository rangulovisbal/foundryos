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

      <section className="foundry-dark-panel p-5 text-[#E0EBF0] md:p-8">
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              Actions and 30-day plan
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              Turn the read into{" "}
              <span className="font-serif-display text-[#F4F2EC]">executable work.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              The action layer stores priorities, owner suggestions, reasoning, weekly
              sequencing, and success signals without claiming live delivery or billing
              automation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {latestActionPlan ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#action-list">
                  View actions
                </Link>
              ) : null}
              {latestThirtyDayPlan ? (
                <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="#thirty-day-plan">
                  View 30-day plan
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Latest plan
            </p>
            <p className="mt-4 text-5xl font-semibold leading-none tracking-[-0.06em] text-white">
              {latestThirtyDayPlan ? "Saved" : "Missing"}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              {latestThirtyDayPlan
                ? new Date(latestThirtyDayPlan.createdAt).toLocaleString()
                : "Generate after diagnostics."}
            </p>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Generate
              </p>
              <div className="mt-4">
                <PlanningGenerateButton
                  canGenerate={canGenerate}
                  disabledReason={disabledReason}
                  endpoint="/api/app/actions/generate"
                  idleLabel="Generate actions"
                  loadingLabel="Generating plan..."
                  successLabel="Actions and 30-day plan generated and saved."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
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
              detail:
                "The workspace language drives generated planning content and the core app experience."
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
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestActionPlan ? (
        <ActionPlanSection actionPlan={latestActionPlan} />
      ) : (
        <section className="surface p-5 md:p-7">
          <span className="eyebrow">No actions yet</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
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
    <section className="surface p-5 md:p-7">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
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
  const highPriority = actionPlan.actions.filter((action) => action.priority === "high").length;
  const inProgress = actionPlan.actions.filter(
    (action) => action.status === "in_progress"
  ).length;

  return (
    <section className="surface p-5 md:p-7" id="action-list">
      <span className="eyebrow">Action list</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
        Prioritized actions from the latest planning run.
      </h2>
      <p className="mt-4 text-sm text-muted">
        Saved {new Date(actionPlan.createdAt).toLocaleString()}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        <article className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Total actions
          </p>
          <p className="mt-3 text-2xl font-semibold">{actionPlan.actions.length}</p>
        </article>
        <article className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            High priority
          </p>
          <p className="mt-3 text-2xl font-semibold">{highPriority}</p>
        </article>
        <article className="metric-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            In progress
          </p>
          <p className="mt-3 text-2xl font-semibold">{inProgress}</p>
        </article>
      </div>
      <div className="foundry-card-grid mt-6">
        {actionPlan.actions.map((action) => (
          <ActionCard action={action} key={`${action.priority}-${action.title}`} />
        ))}
      </div>
    </section>
  );
}

function ActionCard({ action }: { action: PlanActionItem }) {
  return (
    <article className="metric-card">
      <div className="flex flex-wrap gap-2">
        <span className="pill bg-white text-ink">
          {action.priority} priority
        </span>
        <span className="pill bg-sand text-ink">
          {action.status.replaceAll("_", " ")}
        </span>
        <span className="pill bg-white text-ink">{action.linkedCategory}</span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">{action.title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{action.description}</p>
      <p className="mt-4 text-sm text-muted">
        <strong className="text-ink">Owner:</strong> {action.ownerSuggestion}
      </p>
      <details className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-4 text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-ink">
          View reasoning
        </summary>
        <p className="mt-3">{action.linkedReasoning}</p>
      </details>
    </article>
  );
}

function ThirtyDayPlanSection({ plan }: { plan: ThirtyDayPlanRecord }) {
  return (
    <section className="space-y-6" id="thirty-day-plan">
      <div className="surface p-5 md:p-7">
        <span className="eyebrow">30-day plan</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          {plan.monthObjective}
        </h2>
        <p className="mt-4 text-sm text-muted">
          Saved {new Date(plan.createdAt).toLocaleString()}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Top priorities
            </p>
            <p className="mt-3 text-2xl font-semibold">{plan.topPriorities.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Quick wins
            </p>
            <p className="mt-3 text-2xl font-semibold">{plan.quickWins.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Metrics to watch
            </p>
            <p className="mt-3 text-2xl font-semibold">{plan.metricsToWatch.length}</p>
          </article>
        </div>
      </div>

      <section className="foundry-card-grid">
        <ListCard title="Top 3 priorities" values={plan.topPriorities} />
        <ListCard title="Quick wins" values={plan.quickWins} />
        <ListCard title="Risks to avoid" values={plan.risksToAvoid} />
      </section>

      <section className="foundry-week-grid">
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
    <article className="metric-card foundry-readable-card">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{week.title}</p>
      <h3 className="mt-3 text-lg font-semibold leading-7">{week.objective}</h3>
      <p className="mt-4 text-sm leading-6 text-muted">
        <strong className="text-ink">Signal:</strong> {week.successSignal}
      </p>
      <details className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-4 text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-ink">
          View weekly actions
        </summary>
        <ul className="mt-3 space-y-3 leading-7">
          {week.actions.map((action) => (
            <li key={action}>- {action}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function ListCard({ title, values }: { title: string; values: string[] }) {
  return (
    <article className="metric-card">
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
