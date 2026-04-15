import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
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

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Roadmap</span>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              Turn the latest diagnostic into a staged operating roadmap.
            </h2>
            <p className="mt-4 body-lg">
              Roadmap items are persisted and grouped into now, next, and later
              recommendations with effort, impact, dependencies, and reasoning.
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Source diagnostic
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {latestDiagnostic
                ? `${latestDiagnostic.overallMaturityScore}/100`
                : "Missing"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {latestDiagnostic
                ? `Confidence: ${latestDiagnostic.confidence}`
                : "Run diagnostics first."}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PlanningGenerateButton
            canGenerate={canGenerate}
            disabledReason={disabledReason}
            endpoint="/api/app/roadmap/generate"
            idleLabel="Generate roadmap"
            loadingLabel="Generating roadmap..."
            successLabel="Roadmap generated and saved."
          />
        </div>
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestRoadmap ? (
        <RoadmapResult roadmap={latestRoadmap} />
      ) : (
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">No roadmap yet</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
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
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
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
  return (
    <section className="space-y-6">
      <div className="surface p-6 md:p-8">
        <span className="eyebrow">Latest roadmap</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {roadmap.summary}
        </h2>
        <p className="mt-4 text-sm text-muted">
          Saved {new Date(roadmap.createdAt).toLocaleString()}
        </p>
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

  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
              key={`${phase}-${item.title}`}
            >
              <div className="flex flex-wrap gap-2">
                {item.categoryTags.map((tag) => (
                  <span
                    className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-muted">
                <p>
                  <strong className="text-ink">Effort:</strong> {item.effortLevel}
                </p>
                <p>
                  <strong className="text-ink">Expected impact:</strong>{" "}
                  {item.expectedImpact}
                </p>
                <p>
                  <strong className="text-ink">Dependencies:</strong>{" "}
                  {item.dependencies.join(", ")}
                </p>
                <p>
                  <strong className="text-ink">Why:</strong> {item.reasoning}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted">No {label.toLowerCase()} items saved.</p>
        )}
      </div>
    </section>
  );
}

function PlanningHistoryTable({ history }: { history: PlanningJobWithArtifacts[] }) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">
        Roadmap history
      </p>
      <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
        <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
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
    </section>
  );
}
