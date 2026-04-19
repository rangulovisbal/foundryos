import Link from "next/link";

import { BusinessProfileForm } from "@/components/business-profile-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { getBusinessProfile } from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canManageWorkspace,
  canRunDiagnostics,
  canEditBusinessProfile,
  getUsageCounter,
  isLockedState,
  isReadOnlyState,
  type BusinessProfileRecord
} from "@/lib/foundation";

function profileCompletion(profile: BusinessProfileRecord | null) {
  if (!profile) {
    return 0;
  }

  const values = [
    profile.companyName,
    profile.website,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.budgetBand,
    profile.lifecycleStage,
    profile.currentChannels.length > 0 ? "channels" : null,
    profile.currentTools.length > 0 ? "tools" : null,
    profile.primaryGoals.length > 0 ? "goals" : null,
    profile.biggestBottlenecks.length > 0 ? "bottlenecks" : null
  ];

  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function resolveDiagnosticDisabledReason(
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>
) {
  if (isLockedState(context.workspace.accountState)) {
    return "Diagnostics are locked for this workspace account state.";
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return "Diagnostics are read-only while this workspace account state is limited.";
  }

  if (!canManageWorkspace(context.membership.role, context.workspace.accountState)) {
    return "Only workspace owners and admins can run diagnostics in this MVP.";
  }

  const counter = getUsageCounter(context, "diagnostic_runs");
  if (!counter) {
    return "This workspace does not have a diagnostic run entitlement configured.";
  }

  if (counter.usedCount >= counter.limitCount) {
    return `Diagnostic run limit reached: ${counter.usedCount}/${counter.limitCount}.`;
  }

  return "Diagnostic runs are unavailable.";
}

export default async function BusinessProfilePage() {
  const context = await requireWorkspaceContext("/app/profile");
  const profile = await getBusinessProfile(context.workspace.id);
  const completion = profileCompletion(profile);
  const canEdit = canEditBusinessProfile(
    context.membership.role,
    context.workspace.accountState
  );
  const canRunDiagnostic = canRunDiagnostics(context);
  const diagnosticDisabledReason = resolveDiagnosticDisabledReason(context);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel accountState={context.workspace.accountState} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="metric-card md:col-span-2">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Product setup
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Guided business profile setup
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            FoundryOS now groups the same profile model into guided sections so
            the workspace can collect clearer context before diagnostics and
            planning runs.
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Profile completion
          </p>
          <p className="mt-3 text-5xl font-semibold">{completion}%</p>
          <p className="mt-2 text-sm text-muted">
            {profile ? "Saved profile context found." : "No profile saved yet."}
          </p>
        </article>
      </section>

      <BusinessProfileForm
        canEdit={canEdit}
        canRunDiagnostic={canRunDiagnostic}
        diagnosticDisabledReason={diagnosticDisabledReason}
        outputLanguage={context.workspace.outputLanguage}
        profile={profile}
      />

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Next step</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Review the profile, then run diagnostics from the same flow.
        </h2>
        <p className="mt-4 body-lg">
          The review step now saves the same business profile payload underneath,
          then can launch the diagnostic directly with visible evidence and
          trust-aware confidence.
        </p>
        <Link
          className="mt-6 inline-flex rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
          href="/app/diagnostics"
        >
          Open diagnostics
        </Link>
      </section>
    </div>
  );
}
