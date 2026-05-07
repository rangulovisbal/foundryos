"use client";

import Script from "next/script";
import { FormEvent, useState } from "react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type LeadState = {
  name: string;
  email: string;
  company: string;
  website: string;
  teamSize: string;
  message: string;
  consent: boolean;
};

const defaultState: LeadState = {
  name: "",
  email: "",
  company: "",
  website: "",
  teamSize: "2-5",
  message: "",
  consent: true
};

type LeadCaptureFormProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
};

export function LeadCaptureForm({
  id = "snapshot-request",
  eyebrow = "Request assisted pilot access",
  title = "Request a founder-reviewed Snapshot and first 30-day plan.",
  description = "Use this form to request the free assisted design-partner pilot. FoundryOS starts from founder-entered context and visible evidence you share; draft outputs are reviewed before they are treated as pilot guidance.",
  buttonLabel = "Request pilot access"
}: LeadCaptureFormProps) {
  const [form, setForm] = useState<LeadState>(defaultState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const url = new URL(window.location.href);
      const turnstileToken = (
        document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      )?.value;

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          source: "website",
          snapshotRequested: true,
          utmSource: url.searchParams.get("utm_source") ?? "",
          utmMedium: url.searchParams.get("utm_medium") ?? "",
          utmCampaign: url.searchParams.get("utm_campaign") ?? "",
          turnstileToken
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Lead submission failed.");
      }

      setStatus("success");
      setMessage(payload.message ?? "Request received.");
      setForm(defaultState);
    } catch (submissionError) {
      setStatus("error");
      setMessage(
        submissionError instanceof Error
          ? submissionError.message
          : "Lead submission failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="surface p-6 md:p-8" id={id}>
      {siteKey ? (
        <Script
          defer
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            {title}
          </h2>
          <p className="mt-4 body-lg">{description}</p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Name"
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              value={form.name}
            />
            <InputField
              label="Email"
              onChange={(value) => setForm((current) => ({ ...current, email: value }))}
              type="email"
              value={form.email}
            />
            <InputField
              label="Company"
              onChange={(value) =>
                setForm((current) => ({ ...current, company: value }))
              }
              value={form.company}
            />
            <InputField
              label="Website"
              onChange={(value) =>
                setForm((current) => ({ ...current, website: value }))
              }
              placeholder="https://example.com"
              value={form.website}
            />
          </div>

          <label className="space-y-2 text-sm font-medium">
            <span>Team size</span>
            <select
              className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
              onChange={(event) =>
                setForm((current) => ({ ...current, teamSize: event.target.value }))
              }
              value={form.teamSize}
            >
              <option value="solo">Solo</option>
              <option value="2-5">2-5</option>
              <option value="6-10">6-10</option>
              <option value="11-20">11-20</option>
              <option value="20+">20+</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            <span>Context</span>
            <textarea
              className="min-h-32 w-full rounded-[24px] border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              placeholder="Tell us what feels unclear or missing in your marketing right now: offer, audience, message, channels, conversion, proof, or measurement."
              value={form.message}
            />
          </label>

          <label className="flex items-start gap-3 rounded-[24px] border border-[color:var(--border)] bg-white/85 px-4 py-4 text-sm text-muted">
            <input
              checked={form.consent}
              className="mt-1 h-4 w-4"
              onChange={(event) =>
                setForm((current) => ({ ...current, consent: event.target.checked }))
              }
              type="checkbox"
            />
            <span>
              I agree to be contacted about FoundryOS. If paid plans are enabled
              later, payment processing will be handled directly by Stripe.
            </span>
          </label>

          {siteKey ? (
            <div
              className="cf-turnstile"
              data-sitekey={siteKey}
              data-theme="light"
            />
          ) : (
            <p className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
              Cloudflare Turnstile is optional. Add the site and secret keys to
              enable bot protection on this form.
            </p>
          )}

          <button
            className="rounded-[24px] bg-coral px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Submitting..." : buttonLabel}
          </button>

          {status !== "idle" ? (
            <p
              className={`rounded-2xl px-4 py-3 text-sm ${
                status === "success"
                  ? "border border-teal/30 bg-teal/10 text-teal"
                  : "border border-coral/30 bg-coral/10 text-coral"
              }`}
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
