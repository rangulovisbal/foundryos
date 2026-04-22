import Link from "next/link";

import { DownstreamTrustPanel } from "@/components/downstream-trust-panel";
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
import { resolveDownstreamTrustState } from "@/lib/downstream-trust";

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
              Assets
            </span>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white md:text-6xl">
              Package the plan into{" "}
              <span className="font-serif-display text-[#F4F2EC]">usable artifacts.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              Assets use the saved profile, diagnostic, roadmap, action list, and 30-day plan.
              They remain structured preview artifacts, not automated fulfillment or live billing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {latestAssets.length > 0 ? (
                <Link className="foundry-primary-button bg-white text-[#051A24] hover:bg-[#F4F2EC]" href="#asset-set">
                  View latest assets
                </Link>
              ) : null}
              <Link className="foundry-secondary-button border-white/15 bg-white/10 text-white hover:bg-white/15" href="/app/actions">
                Source plan
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Asset runs
            </p>
            <p className="mt-4 text-6xl font-semibold leading-none tracking-[-0.06em] text-white">
              {assetCounter ? `${assetCounter.usedCount}/${assetCounter.limitCount}` : "n/a"}
            </p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              Usage is tracked as generation runs while export workflows remain preview-only.
            </p>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-white/90 p-4 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Generate
              </p>
              <div className="mt-4">
                <PlanningGenerateButton
                  canGenerate={canGenerate}
                  disabledReason={disabledReason}
                  endpoint="/api/app/assets/generate"
                  idleLabel="Generate assets"
                  loadingLabel="Generating assets..."
                  successLabel="Assets generated and saved."
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
              detail:
                "The workspace language drives generated asset content and the core app experience."
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

      <DownstreamTrustPanel language={context.workspace.outputLanguage} state={trustState} />

      {latestAssets.length > 0 ? (
        <LatestAssetsSection assets={latestAssets} />
      ) : (
        <section className="surface p-5 md:p-7">
          <span className="eyebrow">No assets yet</span>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
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
    <section className="surface p-5 md:p-7">
      <span className="eyebrow">Prerequisites</span>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
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
  const assetTypes = Array.from(new Set(assets.map((asset) => formatAssetType(asset.assetType))));

  return (
    <section className="space-y-6" id="asset-set">
      <div className="surface p-5 md:p-7">
        <span className="eyebrow">Latest asset set</span>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          {assets.length} structured assets are saved.
        </h2>
        <p className="mt-4 text-sm text-muted">
          Last generated {new Date(assets[0].createdAt).toLocaleString()}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Asset types
            </p>
            <p className="mt-3 text-2xl font-semibold">{assetTypes.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Saved artifacts
            </p>
            <p className="mt-3 text-2xl font-semibold">{assets.length}</p>
          </article>
          <article className="metric-card">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Source-backed
            </p>
            <p className="mt-3 text-2xl font-semibold">Yes</p>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {assetTypes.map((type) => (
            <span className="pill bg-white/85 text-ink" key={type}>
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
        {assets.map((asset) => (
          <AssetCard asset={asset} key={asset.id} />
        ))}
      </div>
    </section>
  );
}

function AssetCard({ asset }: { asset: BusinessAssetRecord }) {
  return (
    <article className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6 shadow-[0_18px_45px_-32px_rgba(5,26,36,0.65)]">
      <div className="flex flex-wrap gap-2">
        <span className="pill bg-white text-ink">
          {formatAssetType(asset.assetType)}
        </span>
        <span className="pill bg-sand text-ink">
          {asset.generationStatus}
        </span>
        <span className="pill bg-white text-ink">{asset.content.length} sections</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
        {asset.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">{asset.purpose}</p>

      <div className="mt-5 grid gap-4">
        {asset.content.map((section) => (
          <details
            className="rounded-[22px] border border-[color:var(--border)] bg-sand/50 p-4"
            key={`${asset.id}-${section.heading}`}
          >
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.14em] text-ink">
              {section.heading}
            </summary>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
              {section.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </details>
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
        <div className="foundry-table-frame">
          <table className="foundry-table">
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
