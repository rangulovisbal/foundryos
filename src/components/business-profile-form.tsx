"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { BusinessProfileRecord, OutputLanguage } from "@/lib/foundation";

type ProfileDraft = {
  companyName: string;
  outputLanguage: OutputLanguage;
  website: string;
  industry: string;
  businessModel: string;
  teamSize: string;
  geography: string;
  primaryOffer: string;
  targetAudience: string;
  currentChannels: string;
  currentTools: string;
  primaryGoals: string;
  biggestBottlenecks: string;
  budgetBand: string;
  lifecycleStage: string;
};

type ProfileStepKey =
  | "business-basics"
  | "current-state"
  | "offer-audience"
  | "bottlenecks"
  | "goals"
  | "systems"
  | "output-language"
  | "review";

type StepDefinition = {
  key: ProfileStepKey;
  label: string;
  description: string;
  fields: Array<keyof ProfileDraft>;
};

const wizardSteps: StepDefinition[] = [
  {
    key: "business-basics",
    label: "Business basics",
    description:
      "Start with the core identity of the business so later answers stay grounded in the right company context.",
    fields: ["companyName", "website", "industry", "businessModel"]
  },
  {
    key: "current-state",
    label: "Current state",
    description:
      "Capture the current shape of the company: team, geography, stage, and budget range.",
    fields: ["teamSize", "geography", "lifecycleStage", "budgetBand"]
  },
  {
    key: "offer-audience",
    label: "Offer and audience",
    description:
      "Describe what the company sells and who it is built for. The diagnostic depends heavily on this step.",
    fields: ["primaryOffer", "targetAudience"]
  },
  {
    key: "bottlenecks",
    label: "Pain points",
    description:
      "List the biggest operational or commercial constraints in the founder’s own language.",
    fields: ["biggestBottlenecks"]
  },
  {
    key: "goals",
    label: "Goals",
    description:
      "State the operating outcomes the workspace wants the system to optimize for next.",
    fields: ["primaryGoals"]
  },
  {
    key: "systems",
    label: "Tools, channels, and operations",
    description:
      "Name the channels and systems already in use so the diagnostic can reason from what exists today.",
    fields: ["currentChannels", "currentTools"]
  },
  {
    key: "output-language",
    label: "Output language",
    description:
      "Choose the language for generated outputs. The app UI stays in English.",
    fields: ["outputLanguage"]
  },
  {
    key: "review",
    label: "Review and run",
    description:
      "Review the captured profile, save it, and optionally run diagnostics from this reviewed input.",
    fields: []
  }
];

function listToText(values: string[] | undefined) {
  return (values ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildInitialDraft(
  profile: BusinessProfileRecord | null,
  outputLanguage: OutputLanguage
): ProfileDraft {
  return {
    companyName: profile?.companyName ?? "",
    outputLanguage,
    website: profile?.website ?? "",
    industry: profile?.industry ?? "",
    businessModel: profile?.businessModel ?? "",
    teamSize: profile?.teamSize ?? "",
    geography: profile?.geography ?? "",
    primaryOffer: profile?.primaryOffer ?? "",
    targetAudience: profile?.targetAudience ?? "",
    currentChannels: listToText(profile?.currentChannels),
    currentTools: listToText(profile?.currentTools),
    primaryGoals: listToText(profile?.primaryGoals),
    biggestBottlenecks: listToText(profile?.biggestBottlenecks),
    budgetBand: profile?.budgetBand ?? "",
    lifecycleStage: profile?.lifecycleStage ?? ""
  };
}

function fieldHasValue(field: keyof ProfileDraft, value: string) {
  if (field === "outputLanguage") {
    return true;
  }

  return value.trim().length > 0;
}

function stepProgress(draft: ProfileDraft, step: StepDefinition) {
  if (step.fields.length === 0) {
    return {
      completedCount: 0,
      totalCount: 0,
      isComplete: true
    };
  }

  const completedCount = step.fields.filter((field) =>
    fieldHasValue(field, draft[field])
  ).length;

  return {
    completedCount,
    totalCount: step.fields.length,
    isComplete: completedCount === step.fields.length
  };
}

function getInitialStep(
  profile: BusinessProfileRecord | null,
  outputLanguage: OutputLanguage
) {
  const draft = buildInitialDraft(profile, outputLanguage);
  const firstIncomplete = wizardSteps.find(
    (step) => step.key !== "review" && !stepProgress(draft, step).isComplete
  );

  return firstIncomplete?.key ?? "review";
}

function compactValue(value: string) {
  return value.trim().length > 0 ? value.trim() : "Not provided yet.";
}

function compactList(value: string) {
  return textToList(value);
}

function progressPercent(draft: ProfileDraft) {
  const completableSteps = wizardSteps.filter((step) => step.key !== "review");
  const completeCount = completableSteps.filter((step) =>
    stepProgress(draft, step).isComplete
  ).length;

  return Math.round((completeCount / completableSteps.length) * 100);
}

function reviewGroups(draft: ProfileDraft) {
  return [
    {
      title: "Business basics",
      items: [
        ["Company name", compactValue(draft.companyName)] as [string, string],
        ["Website", compactValue(draft.website)] as [string, string],
        ["Industry", compactValue(draft.industry)] as [string, string],
        ["Business model", compactValue(draft.businessModel)] as [string, string]
      ]
    },
    {
      title: "Current state",
      items: [
        ["Team size", compactValue(draft.teamSize)] as [string, string],
        ["Geography", compactValue(draft.geography)] as [string, string],
        ["Lifecycle stage", compactValue(draft.lifecycleStage)] as [string, string],
        ["Budget band", compactValue(draft.budgetBand)] as [string, string]
      ]
    },
    {
      title: "Offer and audience",
      items: [
        ["Primary offer", compactValue(draft.primaryOffer)] as [string, string],
        ["Target audience", compactValue(draft.targetAudience)] as [string, string]
      ]
    },
    {
      title: "Pain points and goals",
      items: [
        [
          "Biggest bottlenecks",
          compactList(draft.biggestBottlenecks).join(", ") || "Not provided yet."
        ] as [string, string],
        [
          "Primary goals",
          compactList(draft.primaryGoals).join(", ") || "Not provided yet."
        ] as [string, string]
      ]
    },
    {
      title: "Systems and output",
      items: [
        [
          "Current channels",
          compactList(draft.currentChannels).join(", ") || "Not provided yet."
        ] as [string, string],
        [
          "Current tools",
          compactList(draft.currentTools).join(", ") || "Not provided yet."
        ] as [string, string],
        [
          "Output language",
          draft.outputLanguage === "es" ? "Spanish output" : "English output"
        ] as [string, string]
      ]
    }
  ];
}

function renderStepFields({
  activeStep,
  canEdit,
  draft,
  inputClass,
  loading,
  textareaClass,
  updateField
}: {
  activeStep: ProfileStepKey;
  canEdit: boolean;
  draft: ProfileDraft;
  inputClass: string;
  loading: boolean;
  textareaClass: string;
  updateField: (field: keyof ProfileDraft, value: string) => void;
}) {
  switch (activeStep) {
    case "business-basics":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company name">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("companyName", event.target.value)}
              placeholder="FoundryOS Studio"
              value={draft.companyName}
            />
          </Field>
          <Field label="Website">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("website", event.target.value)}
              placeholder="https://example.com"
              value={draft.website}
            />
          </Field>
          <Field label="Industry">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("industry", event.target.value)}
              placeholder="B2B SaaS, services, ecommerce..."
              value={draft.industry}
            />
          </Field>
          <Field label="Business model">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("businessModel", event.target.value)}
              placeholder="Subscription, project services, marketplace..."
              value={draft.businessModel}
            />
          </Field>
        </div>
      );
    case "current-state":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Team size">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("teamSize", event.target.value)}
              placeholder="Solo, 2-5, 6-10..."
              value={draft.teamSize}
            />
          </Field>
          <Field label="Geography">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("geography", event.target.value)}
              placeholder="US, Spain, EU, global..."
              value={draft.geography}
            />
          </Field>
          <Field label="Lifecycle stage">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("lifecycleStage", event.target.value)}
              placeholder="Pre-revenue, validated, growing..."
              value={draft.lifecycleStage}
            />
          </Field>
          <Field label="Budget band">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("budgetBand", event.target.value)}
              placeholder="Under 1k, 1k-5k, 5k+..."
              value={draft.budgetBand}
            />
          </Field>
        </div>
      );
    case "offer-audience":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Primary offer">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("primaryOffer", event.target.value)}
              placeholder="What the business sells, how it is packaged, and why a buyer chooses it."
              value={draft.primaryOffer}
            />
          </Field>
          <Field label="Target audience">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("targetAudience", event.target.value)}
              placeholder="Who the business is built for, what they are trying to solve, and why they buy."
              value={draft.targetAudience}
            />
          </Field>
        </div>
      );
    case "bottlenecks":
      return (
        <div className="space-y-4">
          <Field label="Biggest bottlenecks">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("biggestBottlenecks", event.target.value)}
              placeholder={"Manual onboarding\nUnclear channel priorities\nWeak reporting visibility"}
              value={draft.biggestBottlenecks}
            />
          </Field>
          <p className="text-sm text-muted">
            Add one bottleneck per line. Keep the wording close to how the founder
            or operator actually describes the problem.
          </p>
        </div>
      );
    case "goals":
      return (
        <div className="space-y-4">
          <Field label="Primary goals">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("primaryGoals", event.target.value)}
              placeholder={
                "Increase qualified leads\nReduce founder operations time\nImprove weekly KPI visibility"
              }
              value={draft.primaryGoals}
            />
          </Field>
          <p className="text-sm text-muted">
            Add one goal per line. These goals feed the deterministic diagnostic
            and later planning outputs.
          </p>
        </div>
      );
    case "systems":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Current channels">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentChannels", event.target.value)}
              placeholder={"SEO\nReferrals\nLinkedIn outbound"}
              value={draft.currentChannels}
            />
          </Field>
          <Field label="Current tools">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentTools", event.target.value)}
              placeholder={"HubSpot\nGoogle Analytics\nWeekly scorecard"}
              value={draft.currentTools}
            />
          </Field>
        </div>
      );
    case "output-language":
      return (
        <div className="space-y-4">
          <Field label="Generated output language">
            <select
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) =>
                updateField("outputLanguage", event.target.value as OutputLanguage)
              }
              value={draft.outputLanguage}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </Field>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-sand/55 p-4 text-sm text-muted">
            Generated outputs follow this setting across diagnostics, planning,
            and assets. The app UI remains in English for the current MVP.
          </div>
        </div>
      );
    case "review":
      return (
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-sand/55 p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Review before save
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              This step uses the exact same profile payload as before. The only
              change is the intake flow: review the captured context, then save it
              or save and run diagnostics from the reviewed input.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {reviewGroups(draft).map((group) => (
              <ReviewCard group={group} key={group.title} />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function BusinessProfileForm({
  profile,
  outputLanguage,
  canEdit,
  canRunDiagnostic,
  diagnosticDisabledReason
}: {
  profile: BusinessProfileRecord | null;
  outputLanguage: OutputLanguage;
  canEdit: boolean;
  canRunDiagnostic: boolean;
  diagnosticDisabledReason: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() =>
    buildInitialDraft(profile, outputLanguage)
  );
  const [activeStep, setActiveStep] = useState<ProfileStepKey>(() =>
    getInitialStep(profile, outputLanguage)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loadingAction, setLoadingAction] = useState<"save" | "run" | null>(null);

  const activeStepIndex = wizardSteps.findIndex((step) => step.key === activeStep);
  const activeDefinition = wizardSteps[activeStepIndex] ?? wizardSteps[0];
  const completedSteps = wizardSteps.filter(
    (step) => step.key !== "review" && stepProgress(draft, step).isComplete
  ).length;
  const progress = progressPercent(draft);
  const inputClass =
    "w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";
  const textareaClass =
    "min-h-32 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";

  const reviewWarnings = useMemo(
    () =>
      wizardSteps
        .filter((step) => step.key !== "review" && !stepProgress(draft, step).isComplete)
        .map((step) => step.label),
    [draft]
  );

  function updateField(field: keyof ProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    const response = await fetch("/api/app/business-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        outputLanguage: draft.outputLanguage,
        companyName: draft.companyName,
        website: draft.website,
        industry: draft.industry,
        businessModel: draft.businessModel,
        teamSize: draft.teamSize,
        geography: draft.geography,
        primaryOffer: draft.primaryOffer,
        targetAudience: draft.targetAudience,
        currentChannels: textToList(draft.currentChannels),
        currentTools: textToList(draft.currentTools),
        primaryGoals: textToList(draft.primaryGoals),
        biggestBottlenecks: textToList(draft.biggestBottlenecks),
        budgetBand: draft.budgetBand,
        lifecycleStage: draft.lifecycleStage
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Profile save failed.");
    }
  }

  async function runDiagnosticFromReview() {
    const response = await fetch("/api/app/diagnostics/run", {
      method: "POST"
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Diagnostic run failed.");
    }
  }

  async function handlePersist(mode: "save" | "run") {
    if (!canEdit) {
      return;
    }

    if (mode === "run" && !canRunDiagnostic) {
      setMessageTone("error");
      setMessage(diagnosticDisabledReason);
      return;
    }

    setLoadingAction(mode);
    setMessage(null);

    try {
      await saveProfile();

      if (mode === "run") {
        await runDiagnosticFromReview();
        router.push("/app/diagnostics");
        router.refresh();
        return;
      }

      setMessageTone("success");
      setMessage("Business profile saved. You can keep editing or run diagnostics from the review step.");
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "The profile action could not be completed."
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function moveStep(direction: "back" | "next") {
    const nextIndex =
      direction === "back"
        ? Math.max(activeStepIndex - 1, 0)
        : Math.min(activeStepIndex + 1, wizardSteps.length - 1);

    setActiveStep(wizardSteps[nextIndex].key);
  }

  return (
    <form
      className="surface space-y-6 p-6 md:p-8"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div>
            <span className="eyebrow">Guided intake wizard</span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
              Build the profile step by step, then review it before diagnostics.
            </h2>
            <p className="mt-4 body-lg">
              The underlying profile model and save behavior stay the same. This
              flow is only here to improve signal quality and make the intake
              easier to complete well.
            </p>
          </div>

          {!canEdit ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              This profile is read-only for your role or current account state.
            </div>
          ) : null}

          <section className="rounded-[28px] border border-[color:var(--border)] bg-sand/55 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  Intake progress
                </p>
                <p className="mt-2 text-3xl font-semibold">{progress}%</p>
              </div>
              <p className="text-sm text-muted">
                {completedSteps}/{wizardSteps.length - 1} steps completed
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-ink transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <nav className="space-y-3" aria-label="Profile intake steps">
            {wizardSteps.map((step, index) => {
              const currentProgress = stepProgress(draft, step);
              const isActive = step.key === activeStep;

              return (
                <button
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-ink bg-ink text-sand"
                      : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
                  }`}
                  key={step.key}
                  onClick={() => setActiveStep(step.key)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        isActive ? "text-sand/70" : "text-muted"
                      }`}
                    >
                      Step {index + 1}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        isActive
                          ? "bg-white/15 text-sand"
                          : step.key === "review" || currentProgress.isComplete
                            ? "bg-teal/10 text-teal"
                            : currentProgress.completedCount > 0
                              ? "bg-gold/10 text-gold"
                              : "bg-white text-muted"
                      }`}
                    >
                      {step.key === "review"
                        ? "final"
                        : currentProgress.isComplete
                          ? "ready"
                          : currentProgress.completedCount > 0
                            ? "in progress"
                            : "not started"}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold">{step.label}</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isActive ? "text-sand/80" : "text-muted"
                    }`}
                  >
                    {step.key === "review"
                      ? "Review the full profile, then save or run diagnostics."
                      : `${currentProgress.completedCount}/${currentProgress.totalCount} fields filled`}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted">
                  {activeDefinition.label}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  {activeDefinition.label}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                  {activeDefinition.description}
                </p>
              </div>
              <p className="text-sm text-muted">
                Step {activeStepIndex + 1} of {wizardSteps.length}
              </p>
            </div>

            {activeStep === "review" && reviewWarnings.length > 0 ? (
              <div className="mt-6 rounded-[24px] border border-gold/30 bg-gold/10 p-4 text-sm text-muted">
                Review note: these steps still have missing fields: {reviewWarnings.join(", ")}.
                You can still save a partial profile, but diagnostics will have weaker signal.
              </div>
            ) : null}

            <div className="mt-6">
              {renderStepFields({
                activeStep,
                canEdit,
                draft,
                inputClass,
                loading: loadingAction !== null,
                textareaClass,
                updateField
              })}
            </div>
          </section>

          <div className="flex flex-col gap-4 rounded-[28px] border border-[color:var(--border)] bg-white/85 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={activeStepIndex === 0}
                  onClick={() => moveStep("back")}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={activeStepIndex === wizardSteps.length - 1}
                  onClick={() => moveStep("next")}
                  type="button"
                >
                  Next
                </button>
                <button
                  className="rounded-[24px] border border-[color:var(--border)] bg-sand/60 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                  disabled={!canEdit || loadingAction !== null}
                  onClick={() => void handlePersist("save")}
                  type="button"
                >
                  {loadingAction === "save" ? "Saving..." : "Save draft"}
                </button>
              </div>

              {activeStep === "review" ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
                    disabled={!canEdit || loadingAction !== null}
                    onClick={() => void handlePersist("save")}
                    type="button"
                  >
                    {loadingAction === "save" ? "Saving profile..." : "Save profile"}
                  </button>
                  <button
                    className="rounded-[24px] border border-ink bg-white px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-60"
                    disabled={!canEdit || loadingAction !== null}
                    onClick={() => void handlePersist("run")}
                    type="button"
                  >
                    {loadingAction === "run"
                      ? "Saving and running..."
                      : "Save and run diagnostic"}
                  </button>
                </div>
              ) : null}
            </div>

            {profile?.updatedAt ? (
              <p className="text-sm text-muted">
                Last saved {new Date(profile.updatedAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Draft saves use the same persisted business profile model already in the app.
              </p>
            )}

            {activeStep === "review" && !canRunDiagnostic ? (
              <p className="text-sm text-muted">{diagnosticDisabledReason}</p>
            ) : null}
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-teal/30 bg-teal/10 text-teal"
                  : "border-coral/30 bg-coral/10 text-coral"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function ReviewCard({
  group
}: {
  group: { title: string; items: Array<[string, string]> };
}) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/90 p-5">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{group.title}</p>
      <div className="mt-4 space-y-3">
        {group.items.map(([label, value]) => (
          <div
            className="rounded-[20px] border border-[color:var(--border)] bg-sand/45 px-4 py-3"
            key={`${group.title}-${label}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
