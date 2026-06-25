import Link from "next/link";

import { DownstreamTrustPanel } from "@/components/downstream-trust-panel";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { OutputFeedbackWidget } from "@/components/output-feedback-widget";
import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import { PlanningGenerateButton } from "@/components/planning-generate-button";
import {
  getBusinessProfile,
  getLatestAgenticDiagnosis,
  getLatestActionPlan,
  getLatestDiagnosticResult,
  getLatestThirtyDayPlan,
  listPlanningJobsWithArtifacts
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  DiagnosisOutput,
  type DiagnosisOutput as DiagnosisOutputData
} from "@/lib/agentic/schema";
import { decryptJson } from "@/lib/crypto";
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
import { resolveDownstreamTrustState } from "@/lib/downstream-trust";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  hasDiagnostic: boolean
) {
  if (!hasProfile) {
    return "Complete and save the marketing profile before generating the 30-day plan.";
  }

  if (!hasDiagnostic) {
    return "Run the marketing diagnosis before generating the 30-day plan.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "30-day plan generation is locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "30-day plan generation is read-only while this workspace account state is limited.";
  }

  if (!canGenerateThirtyDayPlan(context)) {
    return "Only workspace owners and admins can generate the 30-day plan in this MVP.";
  }

  return "30-day plan generation is unavailable.";
}

function formatOutputLanguageLabel(language: "en" | "es") {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function ActionsPage() {
  const context = await requireWorkspaceContext("/app/actions");
  const [profile, latestDiagnostic, latestAgentic, latestActionPlan, latestThirtyDayPlan, history] =
    await Promise.all([
      getBusinessProfile(context.workspace.id),
      getLatestDiagnosticResult(context.workspace.id),
      getLatestAgenticDiagnosis(context.workspace.id),
      getLatestActionPlan(context.workspace.id),
      getLatestThirtyDayPlan(context.workspace.id),
      listPlanningJobsWithArtifacts({
        workspaceId: context.workspace.id,
        jobType: "thirty_day_plan_generation",
        limit: 10
      })
    ]);
  let agenticDiagnosis: DiagnosisOutputData | null = null;

  if (latestAgentic) {
    try {
      agenticDiagnosis = DiagnosisOutput.parse(
        decryptJson<unknown>(latestAgentic.outputCiphertext)
      );
    } catch {
      agenticDiagnosis = null;
    }
  }

  const hasAgenticPlan = Boolean(agenticDiagnosis?.plan_30d.length);
  const canGenerate =
    !hasAgenticPlan &&
    canGenerateThirtyDayPlan(context) &&
    Boolean(profile) &&
    Boolean(latestDiagnostic);
  const disabledReason = resolveDisabledReason(
    context,
    Boolean(profile),
    Boolean(latestDiagnostic)
  );
  const trustState = resolveDownstreamTrustState({
    diagnostic: latestDiagnostic,
    language: context.workspace.outputLanguage,
    profile
  });

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="foundry-dark-panel p-5 text-[#E0EBF0] md:p-8">
        <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-start">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
              30-day plan
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              Turn the diagnosis into a{" "}
              <span className="font-serif-display text-[#F4F2EC]">practical month of marketing.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              This layer turns the diagnosis into weekly priorities, owner suggestions,
              reasoning, and success signals without claiming live delivery or autonomous execution.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {hasAgenticPlan ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#agentic-thirty-day-plan">
                  View plan from diagnosis
                </Link>
              ) : latestActionPlan ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#action-list">
                  View fallback actions
                </Link>
              ) : null}
              {!hasAgenticPlan && latestThirtyDayPlan ? (
                <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="#thirty-day-plan">
                  View fallback 30-day plan
                </Link>
              ) : null}
              <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="/app/roadmap">
                Supporting priority list
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Latest plan
            </p>
            <p className="mt-4 text-5xl font-semibold leading-none tracking-[-0.06em] text-white">
              {hasAgenticPlan ? "From diagnosis" : latestThirtyDayPlan ? "Fallback saved" : "Missing"}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              {hasAgenticPlan && latestAgentic
                ? `Diagnosis saved ${new Date(latestAgentic.createdAt).toLocaleString()}.`
                : latestThirtyDayPlan
                ? new Date(latestThirtyDayPlan.createdAt).toLocaleString()
                : "Generate after diagnostics."}
            </p>
            {hasAgenticPlan ? (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Source of truth
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  This page is reading `plan_30d` directly from the latest strategic diagnosis.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Fallback generator
                </p>
                <div className="mt-4">
                  <PlanningGenerateButton
                    canGenerate={canGenerate}
                    disabledReason={disabledReason}
                    endpoint="/api/app/actions/generate"
                    idleLabel="Generate fallback 30-day plan"
                    loadingLabel="Generating fallback 30-day plan..."
                    successLabel="Fallback 30-day marketing plan generated and saved."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PageSummaryGrid
          items={[
            {
              label: "Action cards",
              value: hasAgenticPlan
                ? String(
                    agenticDiagnosis?.plan_30d.reduce(
                      (total, week) => total + week.tasks.length,
                      0
                    ) ?? 0
                  )
                : String(latestActionPlan?.actions.length ?? 0),
              detail: hasAgenticPlan
                ? "Tasks from the latest strategic diagnosis."
                : latestActionPlan
                  ? "Saved fallback action list from the latest deterministic run."
                  : "No persisted action list yet."
            },
            {
              label: "30-day plan",
              value: hasAgenticPlan ? "From diagnosis" : latestThirtyDayPlan ? "Fallback saved" : "Missing",
              detail: hasAgenticPlan
                ? "The diagnosis is the source of truth for this plan."
                : latestThirtyDayPlan
                ? latestThirtyDayPlan.monthObjective
                : "Generate after the marketing diagnosis."
            },
            {
              label: "Weeks",
              value: hasAgenticPlan
                ? String(agenticDiagnosis?.plan_30d.length ?? 0)
                : latestThirtyDayPlan
                  ? "4"
                  : "0",
              detail: hasAgenticPlan
                ? "Four weeks supplied by the strategic diagnosis."
                : "Fallback plan weeks from the deterministic generator."
            },
            {
              label: "Output language",
              value: formatOutputLanguageLabel(context.workspace.outputLanguage),
              detail:
                "The workspace language drives generated 30-day planning content and the core app experience."
            }
          ]}
        />
        <PageSectionLinks
          links={[
            ...(hasAgenticPlan
              ? [{ href: "#agentic-thirty-day-plan", label: "Plan from diagnosis" }]
              : latestActionPlan
                ? [{ href: "#action-list", label: "Fallback monthly actions" }]
                : []),
            ...(!hasAgenticPlan && latestThirtyDayPlan
              ? [{ href: "#thirty-day-plan", label: "Fallback 30-day plan" }]
              : []),
            ...(!hasAgenticPlan ? [{ href: "#action-history", label: "Fallback history" }] : [])
          ]}
        />
      </section>

      {!hasAgenticPlan && (!profile || !latestDiagnostic) ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {!hasAgenticPlan ? (
        <DownstreamTrustPanel language={context.workspace.outputLanguage} state={trustState} />
      ) : null}

      {hasAgenticPlan && agenticDiagnosis ? (
        <AgenticThirtyDayPlanSection
          createdAt={latestAgentic?.createdAt}
          model={latestAgentic?.model}
          plan={agenticDiagnosis.plan_30d}
        />
      ) : latestActionPlan ? (
        <ActionPlanSection actionPlan={latestActionPlan} />
      ) : (
        <section className="surface p-5 md:p-7">
          <span className="eyebrow">No 30-day plan yet</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            Generate the first 30-day marketing plan after the diagnosis is complete.
          </h2>
          <p className="mt-4 body-lg">
            Actions are persisted as structured cards so the marketing plan stays
            concrete without pretending the product is already managing execution for you.
          </p>
        </section>
      )}

      {latestThirtyDayPlan ? (
        !hasAgenticPlan ? <ThirtyDayPlanSection plan={latestThirtyDayPlan} /> : null
      ) : null}

      {hasAgenticPlan && latestAgentic ? (
        <OutputFeedbackWidget
          workspaceId={context.workspace.id}
          moduleType="plan_30d"
          outputId={latestAgentic.id}
          language={context.workspace.outputLanguage}
        />
      ) : latestThirtyDayPlan ? (
        <OutputFeedbackWidget
          workspaceId={context.workspace.id}
          moduleType="plan_30d"
          outputId={latestThirtyDayPlan.id}
          language={context.workspace.outputLanguage}
        />
      ) : null}

      {!hasAgenticPlan ? <PlanningHistoryTable history={history} /> : null}
    </div>
  );
}

function AgenticThirtyDayPlanSection({
  createdAt,
  model,
  plan
}: {
  createdAt?: string;
  model?: string;
  plan: DiagnosisOutputData["plan_30d"];
}) {
  const taskCount = plan.reduce((total, week) => total + week.tasks.length, 0);

  return (
    <section className="space-y-6" id="agentic-thirty-day-plan">
      <div className="surface p-5 md:p-7">
        <span className="eyebrow">30-day plan from diagnosis</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          The latest strategic diagnosis is the source of this plan.
        </h2>
        <p className="mt-4 text-sm text-muted">
          {createdAt ? `Diagnosis saved ${new Date(createdAt).toLocaleString()}.` : null}
          {model ? ` Model: ${model}.` : null}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Weeks
            </p>
            <p className="mt-3 text-2xl font-semibold">{plan.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Tasks
            </p>
            <p className="mt-3 text-2xl font-semibold">{taskCount}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Source
            </p>
            <p className="mt-3 text-2xl font-semibold">Diagnosis</p>
          </article>
        </div>
      </div>

      <section className="foundry-week-grid">
        {plan.map((week) => (
          <article className="metric-card foundry-readable-card" key={week.week}>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Week {week.week}
            </p>
            <h3 className="mt-3 text-lg font-semibold leading-7">{week.focus}</h3>
            <div className="mt-4 space-y-3">
              {week.tasks.map((task, index) => (
                <div
                  className="rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-4"
                  key={`${week.week}-${task.title}-${index}`}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="pill bg-white text-ink">Effort {task.effort}</span>
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-ink">{task.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted">{task.why}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    <strong className="text-ink">Done when:</strong> {task.done_when}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
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
        The 30-day plan needs profile and diagnostic inputs.
      </h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {!hasProfile ? (
          <Link
            className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
            href="/app/profile"
          >
            Complete marketing profile
          </Link>
        ) : null}
        {!hasDiagnostic ? (
          <Link
            className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
            href="/app/diagnostics"
          >
            Run marketing diagnosis
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
      <span className="eyebrow">Monthly actions</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
        Prioritized marketing actions from the latest planning run.
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
        <div className="foundry-table-frame">
          <table className="foundry-table">
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
