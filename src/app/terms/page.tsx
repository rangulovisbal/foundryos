import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms | ${siteConfig.name}`,
  description:
    "Pilot-ready FoundryOS terms covering preview scope, account responsibilities, support handling, and product output limitations."
};

const sections = [
  {
    title: "Preview scope",
    body: [
      "FoundryOS is currently offered as a pilot and preview product. Some workflows are productized and persisted inside the app, but some operational steps remain manual.",
      "A deployment may expose public marketing pages before live checkout, automated billing, or fully staffed support operations are enabled."
    ]
  },
  {
    title: "Accounts and workspace access",
    body: [
      "Users are responsible for maintaining accurate account information and for controlling access to their own credentials.",
      "Workspace owners and admins are responsible for who they invite into a workspace and for how shared operating data is reviewed internally."
    ]
  },
  {
    title: "Billing and access state",
    body: [
      "Billing is not live on every deployment. Where checkout is disabled, access may still be granted manually for pilot testing, and plan/account states may be managed by internal admin.",
      "Nothing on this site should be read as a promise that a live subscription, automated invoicing, or automated dunning flow is already active on the current deployment."
    ]
  },
  {
    title: "Generated outputs",
    body: [
      "Diagnostics, roadmaps, actions, assets, and SOPs are structured operating drafts created from saved workspace context and generated product logic.",
      "These outputs are decision-support artifacts. They are not guaranteed business outcomes, legal advice, tax advice, or a substitute for management judgment."
    ]
  },
  {
    title: "Support and deletion handling",
    body: [
      "Support requests, account deletion requests, and workspace deletion requests are tracked in-product but reviewed manually in the current MVP.",
      "Submitting a request does not guarantee immediate execution, and deletion requests do not hard-delete accounts or workspaces automatically from the UI."
    ]
  },
  {
    title: "Suspension and termination",
    body: [
      "Preview access may be restricted, suspended, or revoked where the product is misused, the workspace state requires restriction, or the pilot is closed.",
      "Internal admin controls used in preview mode are operational controls, not a representation of a final commercial account-governance system."
    ]
  }
] as const;

export default function TermsPage() {
  return (
    <LegalPageShell
      currentPath="/terms"
      eyebrow="Terms"
      intro="These terms describe the current pilot reality of FoundryOS: preview-first access, structured operating outputs, manual support handling where needed, and no promise of automated billing or guaranteed commercial results."
      title="Terms for the current pilot product."
    >
      <section className="section-wrap">
        {sections.map((section) => (
          <article className="surface p-6 md:p-8" key={section.title}>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">{section.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Founder note</p>
        <p className="mt-4 text-sm leading-7 text-muted">
          Before broad commercial launch, these terms still require lawyer review for
          jurisdiction, limitation-of-liability language, tax treatment, and any
          future subscription or refund rules.
        </p>
      </section>
    </LegalPageShell>
  );
}
