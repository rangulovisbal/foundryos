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
  type OutputLanguage,
  type BusinessProfileRecord
} from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

function profileCompletion(profile: BusinessProfileRecord | null) {
  if (!profile) {
    return 0;
  }

  const values = [
    profile.companyName,
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
  context: Awaited<ReturnType<typeof requireWorkspaceContext>>,
  language: OutputLanguage
) {
  if (isLockedState(context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Marketing diagnosis is locked for this workspace account state.",
      "El diagnóstico de marketing está bloqueado para el estado actual de esta cuenta."
    );
  }

  if (isReadOnlyState(context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Marketing diagnosis is read-only while this workspace account state is limited.",
      "El diagnóstico de marketing queda en solo lectura mientras el estado de la cuenta sea limitado."
    );
  }

  if (!canManageWorkspace(context.membership.role, context.workspace.accountState)) {
    return copyForLanguage(
      language,
      "Only workspace owners and admins can run the marketing diagnosis in this MVP.",
      "Solo los owners y admins pueden ejecutar el diagnóstico de marketing en este MVP."
    );
  }

  const counter = getUsageCounter(context, "diagnostic_runs");
  if (!counter) {
    return copyForLanguage(
      language,
      "This workspace does not have a marketing diagnosis run entitlement configured.",
      "Este espacio no tiene configurado un cupo de ejecuciones del diagnóstico de marketing."
    );
  }

  if (counter.usedCount >= counter.limitCount) {
    return copyForLanguage(
      language,
      `Marketing diagnosis run limit reached: ${counter.usedCount}/${counter.limitCount}.`,
      `Se alcanzó el límite del diagnóstico de marketing: ${counter.usedCount}/${counter.limitCount}.`
    );
  }

  return copyForLanguage(
    language,
    "Marketing diagnosis runs are unavailable.",
    "Las ejecuciones del diagnóstico de marketing no están disponibles."
  );
}

export default async function BusinessProfilePage() {
  const context = await requireWorkspaceContext("/app/profile");
  const language = context.workspace.outputLanguage;
  const profile = await getBusinessProfile(context.workspace.id);
  const completion = profileCompletion(profile);
  const canEdit = canEditBusinessProfile(
    context.membership.role,
    context.workspace.accountState
  );
  const canRunDiagnostic = canRunDiagnostics(context);
  const diagnosticDisabledReason = resolveDiagnosticDisabledReason(context, language);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="metric-card md:col-span-2">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Marketing setup", "Configuración de marketing")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            {copyForLanguage(
              language,
              "Guided marketing profile setup",
              "Configuración guiada del perfil de marketing"
            )}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            {copyForLanguage(
              language,
              "FoundryOS now groups the same profile model into guided sections so the workspace can collect clearer marketing context before diagnosis and planning runs.",
              "FoundryOS ahora agrupa el mismo modelo de perfil en secciones guiadas para que el espacio capture un contexto de marketing más claro antes de ejecutar diagnóstico y planificación."
            )}
          </p>
        </article>
        <article className="metric-card">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Profile completion", "Perfil completado")}
          </p>
          <p className="mt-3 text-5xl font-semibold">{completion}%</p>
          <p className="mt-2 text-sm text-muted">
            {profile
              ? copyForLanguage(language, "Saved profile context found.", "Se encontró contexto guardado del perfil.")
              : copyForLanguage(language, "No profile saved yet.", "Todavía no hay perfil guardado.")}
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
        <span className="eyebrow">
          {copyForLanguage(language, "Next step", "Siguiente paso")}
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {copyForLanguage(
              language,
              "Review the profile, then run the marketing diagnosis from the same flow.",
              "Revisa el perfil y luego ejecuta el diagnóstico de marketing desde el mismo flujo."
            )}
          </h2>
          <p className="mt-4 body-lg">
            {copyForLanguage(
              language,
              "The review step now saves the same business profile payload underneath, then can launch the marketing diagnosis directly with visible evidence and trust-aware confidence.",
              "El paso de revisión ahora guarda el mismo payload del perfil y luego puede lanzar el diagnóstico de marketing directamente con evidencia visible y confianza consciente de sus límites."
            )}
          </p>
        <Link
          className="mt-6 inline-flex rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand"
          href="/app/diagnostics"
        >
          {copyForLanguage(language, "Open marketing diagnosis", "Abrir diagnóstico de marketing")}
        </Link>
      </section>
    </div>
  );
}
