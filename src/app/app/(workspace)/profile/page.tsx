import Link from "next/link";

import { BusinessProfileForm } from "@/components/business-profile-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { getBusinessProfile } from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canEditBusinessProfile,
  isLockedState,
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

export default async function BusinessProfilePage() {
  const context = await requireWorkspaceContext("/app/profile");
  const profile = await getBusinessProfile(context.workspace.id);
  const completion = profileCompletion(profile);
  const canEdit = canEditBusinessProfile(
    context.membership.role,
    context.workspace.accountState
  );

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
            Business profile foundation
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This is the first real product module under the authenticated
            workspace. Diagnostics use this saved context instead of relying on a
            raw prompt or one-off intake.
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

      <BusinessProfileForm canEdit={canEdit} profile={profile} />

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Next step</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Run diagnostics after saving the profile.
        </h2>
        <p className="mt-4 body-lg">
          The diagnostics module will persist each run, keep history, and show
          structured evidence rather than a plain AI text dump.
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
