import Link from "next/link";

import { LockedStatePanel } from "@/components/locked-state-panel";
import { PageSectionLinks } from "@/components/page-section-links";
import { PageSummaryGrid } from "@/components/page-summary-grid";
import { PlanningGenerateButton } from "@/components/planning-generate-button";
import {
  getBusinessProfile,
  getLatestActionPlan,
  getLatestBusinessAssets,
  getLatestDiagnosticResult,
  getLatestRoadmap,
  getLatestThirtyDayPlan,
  listAssetJobsWithAssets
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canGenerateAssets,
  getUsageCounter,
  isLockedState,
  isReadOnlyState,
  type AssetJobWithAssets,
  type BusinessAssetRecord
} from "@/lib/foundation";

function resolveDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  hasProfile: boolean,
  hasDiagnostic: boolean,
  hasRoadmap: boolean,
  hasActionPlan: boolean,
  hasThirtyDayPlan: boolean
) {
  if (!hasProfile) {
    return "Complete and save the business profile before generating assets.";
  }

  if (!hasDiagnostic) {
    return "Run diagnostics before generating assets.";
  }

  if (!hasRoadmap || !hasActionPlan || !hasThirtyDayPlan) {
    return "Generate roadmap, actions, and a 30-day plan before generating assets.";
  }

  if (isLockedState(context.workspace.accountState)) {
    return "Asset generation is locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "Asset generation is read-only while this workspace account state is limited.";
  }

  if (!canGenerateAssets(context)) {
    return "Only workspace owners and admins with remaining asset usage can generate assets in this MVP.";
  }

  return "Asset generation is unavailable.";
}

function formatOutputLanguageLabel(language: "en" | "es") {
  return language === "es" ? "Spanish output" : "English output";
}

export default async function AssetsPage() {
  const context = await requireWorkspaceContext("/app/assets");
  const [
    profile,
    latestDiagnostic,
    latestRoadmap,
    latestActionPlan,
    latestThirtyDayPlan,
    latestAssets,
    history
  ] = await Promise.all([
    getBusinessProfile(context.workspace.id),
    getLatestDiagnosticResult(context.workspace.id),
    getLatestRoadmap(context.workspace.id),
    getLatestActionPlan(context.workspace.id),
    getLatestThirtyDayPlan(context.workspace.id),
    getLatestBusinessAssets(context.workspace.id),
    listAssetJobsWithAssets({ workspaceId: context.workspace.id, limit: 10 })
  ]);
  const assetCounter = getUsageCounter(context, "asset_exports");
  const canGenerate =
    canGenerateAssets(context) &&
    Boolean(profile) &&
    Boolean(latestDiagnostic) &&
    Boolean(latestRoadmap) &&
    Boolean(latestActionPlan) &&
    Boolean(latestThirtyDayPlan);
  const disabledReason = resolveDisabledReason(
    context,
    Boolean(profile),
    Boolean(latestDiagnostic),
    Boolean(latestRoadmap),
    Boolean(latestActionPlan),
    Boolean(latestThirtyDayPlan)
  );

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Assets</span>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              Turn planning outputs into saved business artifacts.
            </h2>
            <p className="mt-4 body-lg">
              Assets use the latest profile, diagnostic, roadmap, action list,
              and 30-day plan. They remain structured preview artifacts and are
              not connected to live billing or automated fulfillment.
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Asset runs
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {assetCounter ? `${assetCounter.usedCount}/${assetCounter.limitCount}` : "n/a"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Usage is tracked as generation runs while export workflows remain
              preview-only.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PlanningGenerateButton
            canGenerate={canGenerate}
            disabledReason={disabledReason}
            endpoint="/api/app/assets/generate"
            idleLabel="Generate assets"
            loadingLabel="Generating assets..."
            successLabel="Assets generated and saved."
          />
        </div>
        <div className="mt-6 space-y-4">
          <PageSummaryGrid
            items={[
              {
                label: "Latest asset set",
                value: latestAssets.length > 0 ? `${latestAssets.length} saved` : "Missing",
                detail:
                  latestAssets.length > 0
                    ? `Latest run saved ${new Date(latestAssets[0].createdAt).toLocaleString()}.`
                    : "Generate after profile, diagnostics, roadmap, and actions exist."
              },
              {
                label: "Asset runs",
                value: assetCounter
                  ? `${assetCounter.usedCount}/${assetCounter.limitCount}`
                  : "n/a",
                detail: "Usage is still measured by generation runs in preview mode."
              },
              {
                label: "Latest status",
                value: history[0]?.job.status ?? "none",
                detail: "The newest asset job state across this workspace."
              },
              {
                label: "Output language",
                value: formatOutputLanguageLabel(context.workspace.outputLanguage),
                detail: "System UI stays in English. Generated asset content follows the workspace setting."
              }
            ]}
          />
          <PageSectionLinks
            links={[
              ...(latestAssets.length > 0
                ? [{ href: "#asset-set", label: "Latest assets" }]
                : []),
              { href: "#asset-history", label: "History" }
            ]}
          />
        </div>
      </section>

      {!profile ||
      !latestDiagnostic ||
      !latestRoadmap ||
      !latestActionPlan ||
      !latestThirtyDayPlan ? (
        <PrerequisitePanel
          hasActionPlan={Boolean(latestActionPlan)}
          hasDiagnostic={Boolean(latestDiagnostic)}
          hasProfile={Boolean(profile)}
          hasRoadmap={Boolean(latestRoadmap)}
          hasThirtyDayPlan={Boolean(latestThirtyDayPlan)}
        />
      ) : null}

      {latestAssets.length > 0 ? (
        <LatestAssetsSection assets={latestAssets} />
      ) : (
        <section className="surface p-6 md:p-8">
          <span className="eyebrow">No assets yet</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
            Generate the first asset set after planning is complete.
          </h2>
          <p className="mt-4 body-lg">
            The first MVP asset set includes positioning, messaging, channel,
            checklist, action summary, and founder summary artifacts.
          </p>
        </section>
      )}

      <AssetHistoryTable history={history} />
    </div>
  );
}

function PrerequisitePanel({
  hasActionPlan,
  hasDiagnostic,
  hasProfile,
  hasRoadmap,
  hasThirtyDayPlan
}: {
  hasActionPlan: boolean;
  hasDiagnostic: boolean;
  hasProfile: boolean;
  hasRoadmap: boolean;
  hasThirtyDayPlan: boolean;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        Assets need saved profile, diagnostics, roadmap, and planning inputs.
      </h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {!hasProfile ? <PrimaryLink href="/app/profile" label="Complete profile" /> : null}
        {!hasDiagnostic ? (
          <SecondaryLink href="/app/diagnostics" label="Run diagnostics" />
        ) : null}
        {!hasRoadmap ? <SecondaryLink href="/app/roadmap" label="Generate roadmap" /> : null}
        {!hasActionPlan || !hasThirtyDayPlan ? (
          <SecondaryLink href="/app/actions" label="Generate actions" />
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

function LatestAssetsSection({ assets }: { assets: BusinessAssetRecord[] }) {
  return (
    <section className="space-y-6" id="asset-set">
      <div className="surface p-6 md:p-8">
        <span className="eyebrow">Latest asset set</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {assets.length} structured assets are saved.
        </h2>
        <p className="mt-4 text-sm text-muted">
          Last generated {new Date(assets[0].createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {assets.map((asset) => (
          <AssetCard asset={asset} key={asset.id} />
        ))}
      </div>
    </section>
  );
}

function AssetCard({ asset }: { asset: BusinessAssetRecord }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-white/85 p-6">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {formatAssetType(asset.assetType)}
        </span>
        <span className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {asset.generationStatus}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
        {asset.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{asset.purpose}</p>

      <div className="mt-5 grid gap-4">
        {asset.content.map((section) => (
          <div
            className="rounded-[22px] border border-[color:var(--border)] bg-sand/50 p-4"
            key={`${asset.id}-${section.heading}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              {section.heading}
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {section.items.map((item) => (
                <li key={item}>- {item}</li>
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
          {asset.sourceReferences.map((source) => (
            <li key={`${asset.id}-${source.sourceType}-${source.referenceId ?? source.label}`}>
              <strong className="text-ink">{source.label}:</strong> {source.detail}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function AssetHistoryTable({ history }: { history: AssetJobWithAssets[] }) {
  return (
    <details className="surface overflow-hidden" id="asset-history">
      <summary className="cursor-pointer px-6 py-5 text-left md:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Generation history</p>
        <p className="mt-2 text-sm text-muted">
          Expand to review older asset runs and failure states.
        </p>
      </summary>
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Assets</th>
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
                    <td className="px-4 py-4">{entry.assets.length}</td>
                    <td className="px-4 py-4 text-muted">
                      {entry.assets.length > 0
                        ? entry.assets
                            .map((asset) => formatAssetType(asset.assetType))
                            .join(", ")
                        : "n/a"}
                    </td>
                    <td className="px-4 py-4 text-muted">{entry.job.error ?? "none"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={5}>
                    No asset generation jobs have been created yet.
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

function formatAssetType(assetType: BusinessAssetRecord["assetType"]) {
  return assetType.replaceAll("_", " ");
}
