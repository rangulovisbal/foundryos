import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
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

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">SOPs</span>
        <div className="mt-4">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">
            Turn business context into structured operating procedures.
          </h2>
          <p className="mt-4 body-lg">
            SOPs use the saved profile and diagnostic findings to generate five
            structured procedures: lead handling, reporting cadence, campaign
            setup, content workflow, and internal approval. They are preview
            operating drafts and are not connected to live integrations or
            billing.
          </p>
        </div>
        <div className="mt-6">
          <PlanningGenerateButton
            canGenerate={canGenerate}
            disabledReason={disabledReason}
            endpoint="/api/app/sops/generate"
            idleLabel="Generate SOPs"
            loadingLabel="Generating SOPs..."
            successLabel="SOPs generated and saved."
          />
        </div>
      </section>

      {!profile || !latestDiagnostic ? (
        <PrerequisitePanel hasDiagnostic={Boolean(latestDiagnostic)} hasProfile={Boolean(profile)} />
      ) : null}

      {latestArtifacts.length > 0 ? (
        <LatestSopsSection artifacts={latestArtifacts} />
      ) : (
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">No SOPs yet</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
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
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
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
    <section className="space-y-6">
      <div className="surface p-6 md:p-8">
        <span className="eyebrow">Latest SOP set</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {artifacts.length} operating procedures are saved.
        </h2>
        <p className="mt-4 text-sm text-muted">
          Last generated {new Date(artifacts[0].createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {artifacts.map((artifact) => (
          <SopCard artifact={artifact} key={artifact.id} />
        ))}
      </div>
    </section>
  );
}

function SopCard({ artifact }: { artifact: SopArtifactRecord }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-white/85 p-6">
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
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">SOP history</p>
      <div className="mt-4 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
        <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
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
    </section>
  );
}
