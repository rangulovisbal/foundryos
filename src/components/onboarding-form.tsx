"use client";

import { FormEvent, useState } from "react";

import {
  bodyIntakeDefaults,
  buildEmptyReport
} from "@/components/onboarding-form-state";
import {
  bottleneckOptions,
  businessTypeOptions,
  goalOptions,
  stageOptions,
  teamSizeOptions,
  type BusinessIntake,
  type SnapshotReport
} from "@/lib/types";
import { SnapshotReportView } from "@/components/snapshot-report";

type SnapshotDraftResponse = SnapshotReport & {
  outputStatus?: "draft_preview";
  reviewNotice?: string;
};

const labelMap: Record<string, string> = {
  saas: "SaaS",
  service: "Service business",
  agency: "Agency",
  ecommerce: "Ecommerce",
  education: "Education / info product",
  other: "Other",
  "pre-revenue": "Pre-revenue",
  validated: "Validated",
  growing: "Growing",
  established: "Established",
  solo: "Solo",
  "2-5": "2-5 people",
  "6-10": "6-10 people",
  "11-20": "11-20 people",
  "20+": "20+ people",
  "increase-demand": "Increase demand",
  "improve-conversion": "Improve conversion",
  "launch-offers": "Launch offers",
  "reduce-ops-load": "Make execution lighter",
  "build-system": "Build a repeatable marketing engine",
  "growth-clarity": "Growth clarity",
  "manual-operations": "No repeatable marketing workflow",
  messaging: "Messaging and positioning",
  "funnel-conversion": "Funnel conversion",
  analytics: "Analytics visibility",
  "team-capacity": "Team capacity"
};

export function OnboardingForm() {
  const [form, setForm] = useState<BusinessIntake>(bodyIntakeDefaults);
  const [report, setReport] = useState<SnapshotReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof BusinessIntake>(
    key: K,
    value: BusinessIntake[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Snapshot generation failed.");
      }

      const payload = (await response.json()) as SnapshotDraftResponse;
      setReport(payload);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "foundryos:last-report",
          JSON.stringify(payload)
        );
      }
    } catch (submissionError) {
      setReport(buildEmptyReport(form.companyName));
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Snapshot generation failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form className="surface p-6 md:p-8" onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div>
              <span className="eyebrow">Snapshot intake</span>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
                Request an initial Snapshot draft for founder review.
              </h1>
              <p className="mt-3 max-w-2xl body-lg">
                This pilot intake creates an initial draft preview from the
                context you provide. It is not a final reviewed output; the
                founder reviews pilot outputs before they are treated as guidance.
              </p>
              <p className="mt-3 max-w-2xl rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm leading-6 text-coral">
                Do not enter private financials, customer lists, passwords, or
                confidential contracts. Optional commercial context should stay
                high-level enough for a pilot review.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Company name</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) => updateField("companyName", event.target.value)}
                  placeholder="Foundry Pulse"
                  value={form.companyName}
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Website</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) => updateField("website", event.target.value)}
                  placeholder="https://example.com"
                  value={form.website}
                />
              </label>

              <SelectField
                label="Business type"
                onChange={(value) =>
                  updateField("businessType", value as BusinessIntake["businessType"])
                }
                options={businessTypeOptions}
                value={form.businessType}
              />

              <SelectField
                label="Stage"
                onChange={(value) =>
                  updateField("stage", value as BusinessIntake["stage"])
                }
                options={stageOptions}
                value={form.stage}
              />

              <SelectField
                label="Team size"
                onChange={(value) =>
                  updateField("teamSize", value as BusinessIntake["teamSize"])
                }
                options={teamSizeOptions}
                value={form.teamSize}
              />

              <label className="space-y-2 text-sm font-medium">
                <span>Pricing / ticket model (optional)</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) =>
                    updateField("pricingModel", event.target.value)
                  }
                  placeholder="Project packages, hourly, subscription, menu pricing"
                  value={form.pricingModel}
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Typical order / project value (optional)</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) =>
                    updateField("typicalOrderValue", event.target.value)
                  }
                  placeholder="Example: small, medium, premium, or a broad range"
                  value={form.typicalOrderValue}
                />
              </label>

              <SelectField
                label="Primary goal"
                onChange={(value) =>
                  updateField("primaryGoal", value as BusinessIntake["primaryGoal"])
                }
                options={goalOptions}
                value={form.primaryGoal}
              />

              <SelectField
                label="Biggest bottleneck"
                onChange={(value) =>
                  updateField(
                    "biggestBottleneck",
                    value as BusinessIntake["biggestBottleneck"]
                  )
                }
                options={bottleneckOptions}
                value={form.biggestBottleneck}
              />

              <label className="space-y-2 text-sm font-medium">
                <span>Main channel today</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) => updateField("mainChannel", event.target.value)}
                  placeholder="LinkedIn, SEO, referrals"
                  value={form.mainChannel}
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Current tools</span>
                <input
                  className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                  onChange={(event) => updateField("currentTools", event.target.value)}
                  placeholder="Instagram, WhatsApp, Google Sheets, simple CRM"
                  value={form.currentTools}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium">
              <span>Context notes</span>
              <textarea
                className="min-h-36 w-full rounded-[24px] border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Add any relevant context: unclear offer, weak message, low conversion, missing proof, channel confusion, or reporting gaps."
                value={form.notes}
              />
            </label>
          </div>

          <div className="space-y-5">
            <div className="surface-strong p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Marketing signals
              </p>
              <div className="mt-4 space-y-4">
                <CheckboxRow
                  checked={form.hasDocumentedSOPs}
                  description="If not, the product will prioritize repeatable marketing workflows and handoffs."
                  label="Documented marketing workflows already exist"
                  onChange={(value) => updateField("hasDocumentedSOPs", value)}
                />
                <CheckboxRow
                  checked={form.hasAnalytics}
                  description="This influences the diagnosis, dashboard guidance, and weekly review cadence."
                  label="Basic measurement is already in place"
                  onChange={(value) => updateField("hasAnalytics", value)}
                />
                <CheckboxRow
                  checked={form.openToAutomation}
                  description="Workflow readiness affects the suggested path and execution support ideas."
                  label="The team is open to workflow tooling"
                  onChange={(value) => updateField("openToAutomation", value)}
                />
              </div>
            </div>

            <div className="surface-strong p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                What you will get
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Marketing clarity score and maturity reading
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  30-day marketing priorities with impact and effort
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Quick wins, risks, and a suggested channel and measurement stack
                </li>
                <li className="rounded-2xl border border-[color:var(--border)] bg-white/85 px-4 py-3">
                  Founder-reviewed guidance before final pilot delivery
                </li>
              </ul>
            </div>

            <button
              className="w-full rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-sand transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Generating draft preview..." : "Generate draft preview"}
            </button>

            {error ? (
              <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </form>

      {report ? (
        <SnapshotReportView
          report={report}
          title={`${form.companyName} marketing draft preview`}
        />
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none ring-0"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labelMap[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[24px] border border-[color:var(--border)] bg-white/85 px-4 py-4">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 rounded border-[color:var(--border)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}
