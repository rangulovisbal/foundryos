import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import { PlanningGenerateButton } from "@/components/planning-generate-button";
import {
  getBusinessProfile,
  getLatestDiagnosticResult,
  getLatestSopArtifacts,
  listSopJobsWithArtifacts
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canGenerateSops,
  isLockedState,
  isReadOnlyState,
  type SopArtifactRecord,
  type SopJobWithArtifacts
} from "@/lib/foundation";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  hasDiagnostic: boolean
) {
  if (!hasProfile) {
    return "Complete and save the business profile before generating SOPs.";
  }

  if (!hasDiagnostic) {
    return "Run diagnostics before generating SOPs.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "SOP generation is locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "SOP generation is read-only while this workspace account state is limited.";
  }

  if (!canGenerateSops(context)) {
    return "Only workspace owners and admins on growth-os or operator plans can generate SOPs in this MVP.";
  }

  return "SOP generation is unavailable.";
}

function formatOutputLanguageLabel(language: "en" | "es") {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function SopsPage() {
  const context = await requireWorkspaceContext("/app/sops");
  const [profile, latestDiagnostic, latestArtifacts, history] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestSopArtifacts(context.workspace.id),
    listSopJobsWithArtifacts({ workspaceId: context.workspace.id, limit: 10 })
  ]);

  const canGenerate =
    canGenerateSops(context) && Boolean(profile) && Boolean(latestDiagnostic);
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
              SOPs
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              Turn context into{" "}
              <span className="font-serif-display text-[#F4F2EC]">repeatable operating steps.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              SOPs use the saved profile and diagnostic findings to draft lead handling,
              reporting, campaign setup, content workflow, and internal approval procedures.
              They are preview operating drafts, not live integrations.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {latestArtifacts.length > 0 ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#sop-set">
                  View latest SOPs
                </Link>
              ) : null}
              <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="/app/diagnostics">
                Source diagnostic
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Latest SOP set
            </p>
            <p className="mt-4 text-6xl font-semibold leading-none tracking-[-0.06em] text-white">
              {latestArtifacts.length > 0 ? latestArtifacts.length : "--"}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              {latestArtifacts.length > 0
                ? `Latest run saved ${new Date(latestArtifacts[0].createdAt).toLocaleString()}.`
                : "Generate after the profile and diagnostics exist."}
            </p>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Generate
              </p>
              <div className="mt-4">
                <PlanningGenerateButton
                  canGenerate={canGenerate}
                  disabledReason={disabledReason}
                  endpoint="/api/app/sops/generate"
                  idleLabel="Generate SOPs"
                  loadingLabel="Generating SOPs..."
                  successLabel="SOPs generated and saved."
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
              label: "Latest SOP set",
              value:
                latestArtifacts.length > 0 ? `${latestArtifacts.length} saved` : "Missing",
              detail:
                latestArtifacts.length > 0
                  ? `Latest run saved ${new Date(latestArtifacts[0].createdAt).toLocaleString()}.`
                  : "Generate after the profile and diagnostics exist."
            },
            {
              label: "Latest status",
              value: history[0]?.job.status ?? "none",
              detail: "The newest SOP generation state for this workspace."
            },
            {
              label: "Procedure types",
              value: latestArtifacts.length > 0 ? String(latestArtifacts.length) : "0",
              detail: "Lead handling, reporting, campaign setup, content, and approvals."
            },
            {
              label: "Output language",
              value: formatOutputLanguageLabel(context.workspace.outputLanguage),
              detail:
                "The workspace language drives generated SOP content and the core app experience."
            }
          ]}
        />
        <PageSectionLinks
          links={[
            ...(latestArtifacts.length > 0 ? [{ href: "#sop-set", label: "Latest SOPs" }] : []),
            { href: "#sop-history", label: "History" }
          ]}
        />
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestArtifacts.length > 0 ? (
        <LatestSopsSection artifacts={latestArtifacts} />
      ) : (
        <section className="surface p-5 md:p-7">
          <span className="eyebrow">No SOPs yet</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
            Generate the first SOP set after the profile and diagnostics are complete.
          </h2>
          <p className="mt-4 body-lg">
            The first MVP SOP set includes lead handling, reporting cadence,
            campaign setup, content workflow, and internal approval procedures.
          </p>
        </section>
      )}

      <SopHistoryTable history={history} />
    </div>
  );
}

function PrerequisitePanel({
  hasProfile,
  hasDiagnostic
}: {
  hasProfile: boolean;
  hasDiagnostic: boolean;
}) {
  return (
    <section className="surface p-5 md:p-7">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
        SOPs need a saved business profile and diagnostic result.
      </h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {!hasProfile ? <PrimaryLink href="/app/profile" label="Complete profile" /> : null}
        {!hasDiagnostic ? (
          <SecondaryLink href="/app/diagnostics" label="Run diagnostics" />
        ) : null}
      </div>
    </section>
  );
}

function PrimaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
      href={href}
    >
      {label}
    </Link>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink"
      href={href}
    >
      {label}
    </Link>
  );
}

function LatestSopsSection({ artifacts }: { artifacts: SopArtifactRecord[] }) {
  return (
    <section className="space-y-6" id="sop-set">
      <div className="surface p-5 md:p-7">
        <span className="eyebrow">Latest SOP set</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          {artifacts.length} operating procedures are saved.
        </h2>
        <p className="mt-4 text-sm text-muted">
          Last generated {new Date(artifacts[0].createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
        {artifacts.map((artifact) => (
          <SopCard artifact={artifact} key={artifact.id} />
        ))}
      </div>
    </section>
  );
}

function SopCard({ artifact }: { artifact: SopArtifactRecord }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_18px_45px_-32px_rgba(5,26,36,0.65)]">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {artifact.sopType.replaceAll("_", " ")}
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {artifact.generationStatus}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
        {artifact.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{artifact.purpose}</p>

      <div className="mt-5 grid gap-4">
        {artifact.content.map((section) => (
          <div
            className="rounded-[22px] border border-[color:var(--border)] bg-sand/50 p-4"
            key={`${artifact.id}-${section.heading}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              {section.heading}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {section.items.map((item, idx) => (
                <li key={`${artifact.id}-${section.heading}-${idx}`}>- {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <details className="mt-5 rounded-[22px] border border-[color:var(--border)] bg-white/80 p-4 text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-ink">
          Source references
        </summary>
        <ul className="mt-3 space-y-2">
          {artifact.sourceReferences.map((source) => (
            <li key={`${artifact.id}-${source.sourceType}-${source.referenceId ?? source.label}`}>
              <strong className="text-ink">{source.label}:</strong> {source.detail}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function SopHistoryTable({ history }: { history: SopJobWithArtifacts[] }) {
  return (
    <details className="surface overflow-hidden" id="sop-history">
      <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Generation history</p>
        <p className="mt-2 text-sm text-muted">
          Expand to review older SOP runs and failure states.
        </p>
      </summary>
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="foundry-table-frame">
          <table className="foundry-table">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">SOPs</th>
                <th className="px-4 py-3 font-semibold">Types</th>
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
                    <td className="px-4 py-4">{entry.artifacts.length}</td>
                    <td className="px-4 py-4 text-muted">
                      {entry.artifacts.length > 0
                        ? entry.artifacts
                            .map((a) => a.sopType.replaceAll("_", " "))
                            .join(", ")
                        : "n/a"}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {entry.job.error ?? "none"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    No SOP generation jobs have been created yet.
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
