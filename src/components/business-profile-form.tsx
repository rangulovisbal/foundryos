"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

type FormSectionKey =
  | "business-basics"
  | "offer-audience"
  | "channels-tools"
  | "goals-language";

type FormSectionDefinition = {
  key: FormSectionKey;
  label: string;
  description: string;
  fields: Array<keyof ProfileDraft>;
};

const formSections: FormSectionDefinition[] = [
  {
    key: "business-basics",
    label: "Business basics",
    description:
      "Capture the business context the rest of the workspace depends on: company, model, team, geography, stage, and current budget shape.",
    fields: [
      "companyName",
      "website",
      "industry",
      "businessModel",
      "teamSize",
      "geography",
      "budgetBand",
      "lifecycleStage"
    ]
  },
  {
    key: "offer-audience",
    label: "Offer and audience",
    description:
      "Define what the company sells, who it is for, and the promise the diagnostic should evaluate.",
    fields: ["primaryOffer", "targetAudience"]
  },
  {
    key: "channels-tools",
    label: "Channels and tools",
    description:
      "List the current channels and operating systems already in use so diagnostics can judge leverage and gaps realistically.",
    fields: ["currentChannels", "currentTools"]
  },
  {
    key: "goals-language",
    label: "Goals, bottlenecks, and output language",
    description:
      "State the operating goals, current friction, and the language that generated outputs should follow. The app interface stays in English.",
    fields: ["primaryGoals", "biggestBottlenecks", "outputLanguage"]
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

function getSectionProgress(draft: ProfileDraft, section: FormSectionDefinition) {
  const completedCount = section.fields.filter((field) =>
    fieldHasValue(field, draft[field])
  ).length;
  const totalCount = section.fields.length;

  return {
    completedCount,
    isComplete: completedCount === totalCount,
    totalCount
  };
}

function getInitialSection(
  profile: BusinessProfileRecord | null,
  outputLanguage: OutputLanguage
) {
  const draft = buildInitialDraft(profile, outputLanguage);
  const firstIncomplete = formSections.find(
    (section) => !getSectionProgress(draft, section).isComplete
  );

  return firstIncomplete?.key ?? formSections[0].key;
}

function renderSectionFields({
  activeSection,
  canEdit,
  draft,
  inputClass,
  loading,
  textareaClass,
  updateField
}: {
  activeSection: FormSectionKey;
  canEdit: boolean;
  draft: ProfileDraft;
  inputClass: string;
  loading: boolean;
  textareaClass: string;
  updateField: (field: keyof ProfileDraft, value: string) => void;
}) {
  switch (activeSection) {
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
          <Field label="Budget band">
            <input
              className={inputClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("budgetBand", event.target.value)}
              placeholder="Under 1k, 1k-5k, 5k+..."
              value={draft.budgetBand}
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
              placeholder="What the business sells and why customers buy it."
              value={draft.primaryOffer}
            />
          </Field>
          <Field label="Target audience">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("targetAudience", event.target.value)}
              placeholder="Who the business is built for and what they need."
              value={draft.targetAudience}
            />
          </Field>
        </div>
      );
    case "channels-tools":
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Current channels">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentChannels", event.target.value)}
              placeholder={"SEO\nReferrals\nLinkedIn"}
              value={draft.currentChannels}
            />
          </Field>
          <Field label="Current tools">
            <textarea
              className={textareaClass}
              disabled={!canEdit || loading}
              onChange={(event) => updateField("currentTools", event.target.value)}
              placeholder={"Stripe\nHubSpot\nGoogle Analytics"}
              value={draft.currentTools}
            />
          </Field>
        </div>
      );
    case "goals-language":
      return (
        <div className="space-y-4">
          <div>
            <Field label="Output language">
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
            <p className="mt-1.5 text-xs leading-5 text-muted">
              Generated outputs follow this language. The app interface, support
              flows, and admin UI remain in English for this MVP.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Primary goals">
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) => updateField("primaryGoals", event.target.value)}
                placeholder={
                  "Increase qualified leads\nReduce founder operations time"
                }
                value={draft.primaryGoals}
              />
            </Field>
            <Field label="Biggest bottlenecks">
              <textarea
                className={textareaClass}
                disabled={!canEdit || loading}
                onChange={(event) =>
                  updateField("biggestBottlenecks", event.target.value)
                }
                placeholder={"Manual onboarding\nUnclear channel priorities"}
                value={draft.biggestBottlenecks}
              />
            </Field>
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
  canEdit
}: {
  profile: BusinessProfileRecord | null;
  outputLanguage: OutputLanguage;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() =>
    buildInitialDraft(profile, outputLanguage)
  );
  const [activeSection, setActiveSection] = useState<FormSectionKey>(() =>
    getInitialSection(profile, outputLanguage)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof ProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
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

      setMessageTone("success");
      setMessage("Business profile saved. Diagnostics can now use this context.");
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Profile save failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";
  const textareaClass =
    "min-h-28 w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none disabled:opacity-60";
  const completedSections = formSections.filter((section) =>
    getSectionProgress(draft, section).isComplete
  ).length;
  const activeSectionIndex = formSections.findIndex(
    (section) => section.key === activeSection
  );
  const activeDefinition = formSections[activeSectionIndex] ?? formSections[0];

  return (
    <form className="surface space-y-6 p-6 md:p-8" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Business profile</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Capture the operating context once, then reuse it across diagnostics.
        </h2>
        <p className="mt-4 body-lg">
          Save progress as you go. The profile now guides setup in sections so a
          founder can move faster without changing the underlying data model.
        </p>
      </div>

      {!canEdit ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          This profile is read-only for your role or current account state.
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[color:var(--border)] bg-sand/50 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Guided intake
            </p>
            <p className="mt-2 text-sm text-muted">
              {completedSections}/{formSections.length} sections are fully filled.
              You can jump back and edit any section before saving.
            </p>
          </div>
          <p className="text-sm text-muted">
            Section {activeSectionIndex + 1} of {formSections.length}
          </p>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-4">
          {formSections.map((section, index) => {
            const progress = getSectionProgress(draft, section);
            const isActive = section.key === activeSection;

            return (
              <button
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-ink bg-ink text-sand"
                    : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
                }`}
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                type="button"
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                    isActive ? "text-sand/70" : "text-muted"
                  }`}
                >
                  Step {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold">{section.label}</p>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    isActive ? "text-sand/80" : "text-muted"
                  }`}
                >
                  {progress.completedCount}/{progress.totalCount} fields filled
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
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
            {getSectionProgress(draft, activeDefinition).isComplete
              ? "Section complete"
              : "Partial section draft"}
          </p>
        </div>

        <div className="mt-6">
          {renderSectionFields({
            activeSection,
            canEdit,
            draft,
            inputClass,
            loading,
            textareaClass,
            updateField
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
            disabled={activeSectionIndex === 0}
            onClick={() =>
              setActiveSection(formSections[Math.max(activeSectionIndex - 1, 0)].key)
            }
            type="button"
          >
            Back
          </button>
          <button
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-ink disabled:opacity-50"
            disabled={activeSectionIndex === formSections.length - 1}
            onClick={() =>
              setActiveSection(
                formSections[
                  Math.min(activeSectionIndex + 1, formSections.length - 1)
                ].key
              )
            }
            type="button"
          >
            Next section
          </button>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <button
            className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
            disabled={!canEdit || loading}
            type="submit"
          >
            {loading ? "Saving profile..." : "Save business profile"}
          </button>
          {profile?.updatedAt ? (
            <p className="text-sm text-muted">
              Last saved {new Date(profile.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
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
    </form>
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
