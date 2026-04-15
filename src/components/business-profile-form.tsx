"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BusinessProfileRecord } from "@/lib/foundation";

type ProfileDraft = {
  companyName: string;
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

function listToText(values: string[] | undefined) {
  return (values ?? []).join("\n");
}

function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildInitialDraft(profile: BusinessProfileRecord | null): ProfileDraft {
  return {
    companyName: profile?.companyName ?? "",
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

export function BusinessProfileForm({
  profile,
  canEdit
}: {
  profile: BusinessProfileRecord | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => buildInitialDraft(profile));
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

  return (
    <form className="surface space-y-6 p-6 md:p-8" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">Business profile</span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          Capture the operating context once, then reuse it across diagnostics.
        </h2>
        <p className="mt-4 body-lg">
          Save progress as you go. Empty fields are allowed in preview, but more
          complete context increases diagnostic confidence.
        </p>
      </div>

      {!canEdit ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          This profile is read-only for your role or current account state.
        </div>
      ) : null}

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
        <Field label="Primary goals">
          <textarea
            className={textareaClass}
            disabled={!canEdit || loading}
            onChange={(event) => updateField("primaryGoals", event.target.value)}
            placeholder={"Increase qualified leads\nReduce founder operations time"}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
