import { env } from "@/lib/env";

const controls = [
  "Account separation by customer",
  "Role-based permissions",
  "Encryption in transit",
  "Activity logs and auditability",
  "Backup and deletion procedures",
  "Consent gates for connectors",
  "Human review for critical outputs",
  "No sensitive data by default"
];

const docs = [
  "Terms of Service",
  "Privacy Policy",
  "Cookie Policy",
  "Refund Policy",
  "DPA",
  "Security page",
  "AI disclosure",
  "Subprocessor list",
  "Retention policy",
  "Incident response plan"
];

export default function SecurityPage() {
  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Security and compliance</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Serious handling of customer data is part of the product, not an afterthought.
        </h1>
        <p className="mt-4 max-w-3xl body-lg">
          The MVP is designed for lean execution, but it still needs clear
          privacy, logging and consent boundaries from day one.
        </p>
      </section>

      <section className="section-wrap">
        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Product controls
          </p>
          <div className="mt-4 space-y-3">
            {controls.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">
            Mandatory legal pack
          </p>
          <div className="mt-4 space-y-3">
            {docs.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">
          Environment status
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="Neon" ready={env.hasNeon} />
          <StatusCard label="Stripe" ready={env.hasStripe} />
          <StatusCard label="OpenAI" ready={env.hasOpenAI} />
          <StatusCard label="PostHog" ready={env.hasPostHog} />
          <StatusCard label="Resend" ready={env.hasResend} />
          <StatusCard label="Turnstile" ready={env.hasTurnstile} />
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, ready }: { label: string; ready: boolean }) {
  return (
    <article className="rounded-[24px] border border-[color:var(--border)] bg-white/80 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">
        {ready ? "Configured" : "Pending"}
      </p>
      <p className="mt-2 text-sm text-muted">
        {ready
          ? "The environment variables are present."
          : "Add the required keys locally and in Vercel."}
      </p>
    </article>
  );
}
