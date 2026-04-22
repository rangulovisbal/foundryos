import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import { PlanningGenerateButton } from "@/components/planning-generate-button";
import {
  getBusinessProfile,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  listPlanningJobsWithArtifacts
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canGenerateRoadmap,
  isLockedState,
  isReadOnlyState,
  type PlanningJobWithArtifacts,
  type RoadmapItem,
  type RoadmapRecord
} from "@/lib/foundation";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  hasDiagnostic: boolean
) {
  if (!hasProfile) {
    return "Complete and save the business profile before generating a roadmap.";
  }

  if (!hasDiagnostic) {
    return "Run diagnostics before generating a roadmap.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "Roadmap generation is locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "Roadmap generation is read-only while this workspace account state is limited.";
  }

  if (!canGenerateRoadmap(context)) {
    return "Only workspace owners and admins can generate roadmap outputs in this MVP.";
  }

  return "Roadmap generation is unavailable.";
}

function formatOutputLanguageLabel(language: "en" | "es") {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function RoadmapPage() {
  const context = await requireWorkspaceContext("/app/roadmap");
  const [profile, latestDiagnostic, latestRoadmap, history] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestRoadmap(context.workspace.id),
    listPlanningJobsWithArtifacts({
      workspaceId: context.workspace.id,
      jobType: "roadmap_generation",
      limit: 10
    })
  ]);
  const canGenerate =
    canGenerateRoadmap(context) && Boolean(profile) && Boolean(latestDiagnostic);
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
              Roadmap
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              Stage the work before it becomes{" "}
              <span className="font-serif-display text-[#F4F2EC]">operating noise.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Roadmap items stay grounded in the latest diagnostic and remain grouped by now,
              next, and later with visible effort, impact, dependencies, and reasoning.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="/app/diagnostics">
                Source diagnostic
              </Link>
              {latestRoadmap ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#roadmap-result">
                  View latest roadmap
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Source diagnostic
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-6xl font-semibold leading-none tracking-[-0.06em] text-white">
                {latestDiagnostic ? latestDiagnostic.overallMaturityScore : "--"}
              </span>
              <span className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                /100
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/68">
              {latestDiagnostic
                ? `Confidence: ${latestDiagnostic.confidence}.`
                : "Run diagnostics first before generating a staged roadmap."}
            </p>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Generate
              </p>
              <div className="mt-4">
                <PlanningGenerateButton
                  canGenerate={canGenerate}
                  disabledReason={disabledReason}
                  endpoint="/api/app/roadmap/generate"
                  idleLabel="Generate roadmap"
                  loadingLabel="Generating roadmap..."
                  successLabel="Roadmap generated and saved."
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
              label: "Latest roadmap",
              value: latestRoadmap ? `${latestRoadmap.items.length} items` : "Missing",
              detail: latestRoadmap
                ? latestRoadmap.summary
                : "Generate after diagnostics are complete."
            },
            {
              label: "Now / next / later",
              value: latestRoadmap
                ? `${latestRoadmap.items.filter((item) => item.phase === "now").length} / ${latestRoadmap.items.filter((item) => item.phase === "next").length} / ${latestRoadmap.items.filter((item) => item.phase === "later").length}`
                : "0 / 0 / 0",
              detail: "Stage distribution from the latest roadmap."
            },
            {
              label: "Latest status",
              value: history[0]?.job.status ?? "none",
              detail: "The newest roadmap job state for this workspace."
            },
            {
              label: "Output language",
              value: formatOutputLanguageLabel(context.workspace.outputLanguage),
              detail:
                "The workspace language drives generated roadmap content and the core app experience."
            }
          ]}
        />
        <PageSectionLinks
          links={[
            ...(latestRoadmap ? [{ href: "#roadmap-result", label: "Latest roadmap" }] : []),
            ...(latestRoadmap ? [{ href: "#roadmap-now", label: "Now" }] : []),
            ...(latestRoadmap ? [{ href: "#roadmap-next", label: "Next" }] : []),
            ...(latestRoadmap ? [{ href: "#roadmap-later", label: "Later" }] : []),
            { href: "#roadmap-history", label: "History" }
          ]}
        />
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestRoadmap ? (
        <RoadmapResult roadmap={latestRoadmap} />
      ) : (
        <section className="surface p-5 md:p-7">
          <span className="eyebrow">No roadmap yet</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            Generate the first roadmap after diagnostics are complete.
          </h2>
          <p className="mt-4 body-lg">
            The roadmap stays structured and reviewable before it becomes the
            input for assets, SOPs, or automation work.
          </p>
        </section>
      )}

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
        Roadmap generation needs saved inputs.
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

function RoadmapResult({ roadmap }: { roadmap: RoadmapRecord }) {
  const phaseCounts = {
    now: roadmap.items.filter((item) => item.phase === "now").length,
    next: roadmap.items.filter((item) => item.phase === "next").length,
    later: roadmap.items.filter((item) => item.phase === "later").length
  };

  return (
    <section className="space-y-6" id="roadmap-result">
      <div className="surface p-5 md:p-7">
        <span className="eyebrow">Latest roadmap</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          {roadmap.summary}
        </h2>
        <p className="mt-4 text-sm text-muted">
          Saved {new Date(roadmap.createdAt).toLocaleString()}
        </p>
        <div className="foundry-card-grid mt-6">
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Total items
            </p>
            <p className="mt-3 text-2xl font-semibold">{roadmap.items.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Now
            </p>
            <p className="mt-3 text-2xl font-semibold">{phaseCounts.now}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Next
            </p>
            <p className="mt-3 text-2xl font-semibold">{phaseCounts.next}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Later
            </p>
            <p className="mt-3 text-2xl font-semibold">{phaseCounts.later}</p>
          </article>
        </div>
      </div>

      {(["now", "next", "later"] as const).map((phase) => (
        <RoadmapPhaseGroup
          items={roadmap.items.filter((item) => item.phase === phase)}
          key={phase}
          phase={phase}
        />
      ))}
    </section>
  );
}

function RoadmapPhaseGroup({
  items,
  phase
}: {
  items: RoadmapItem[];
  phase: RoadmapItem["phase"];
}) {
  const label = phase === "now" ? "Now" : phase === "next" ? "Next" : "Later";
  const sectionId =
    phase === "now" ? "roadmap-now" : phase === "next" ? "roadmap-next" : "roadmap-later";

  return (
    <section className="surface p-5 md:p-7" id={sectionId}>
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted">{label}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            {phase === "now"
              ? "Start here"
              : phase === "next"
                ? "Stage after the immediate fixes"
                : "Hold until the foundation is steadier"}
          </h3>
          <p className="mt-3 text-sm text-muted">
            {items.length > 0
              ? `${items.length} saved roadmap items in this phase.`
              : `No ${label.toLowerCase()} items saved.`}
          </p>
        </div>

        <div className="foundry-card-grid">
          {items.length > 0 ? (
            items.map((item) => (
              <article
                className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
                key={`${phase}-${item.title}`}
              >
                <div className="flex flex-wrap gap-2">
                  <span className="pill bg-sand text-ink">{item.effortLevel} effort</span>
                  <span className="pill bg-white text-ink">
                    {item.expectedImpact} impact
                  </span>
                  {item.categoryTags.map((tag) => (
                    <span className="pill bg-white/85 text-ink" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
                <details className="mt-4 rounded-[20px] border border-[color:var(--border)] bg-sand/45 p-4 text-sm text-muted">
                  <summary className="cursor-pointer font-semibold text-ink">
                    View reasoning and dependencies
                  </summary>
                  <div className="mt-3 grid gap-3">
                    <p>
                      <strong className="text-ink">Dependencies:</strong>{" "}
                      {item.dependencies.join(", ")}
                    </p>
                    <p>
                      <strong className="text-ink">Why this phase:</strong> {item.reasoning}
                    </p>
                  </div>
                </details>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted">No {label.toLowerCase()} items saved.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function PlanningHistoryTable({ history }: { history: PlanningJobWithArtifacts[] }) {
  return (
    <details className="surface overflow-hidden" id="roadmap-history">
      <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">
          Generation history
        </p>
        <p className="mt-2 text-sm text-muted">
          Expand to review earlier roadmap runs and failure states.
        </p>
      </summary>
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="foundry-table-frame">
          <table className="foundry-table">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Roadmap</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
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
                    <td className="px-4 py-4">{entry.roadmap ? "saved" : "n/a"}</td>
                    <td className="px-4 py-4">{entry.actionPlan ? "saved" : "n/a"}</td>
                    <td className="px-4 py-4 text-muted">{entry.job.error ?? "none"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    No roadmap generation jobs yet.
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
