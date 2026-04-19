export const legalLastUpdated = "April 19, 2026";

export const publicLegalLinks = [
  {
    href: "/terms",
    label: "Terms",
    description: "Pilot product terms, preview scope, and usage boundaries."
  },
  {
    href: "/privacy",
    label: "Privacy",
    description: "What workspace and account data is stored and how it is used."
  },
  {
    href: "/cookie",
    label: "Cookie",
    description: "Essential cookies, optional services, and browser controls."
  },
  {
    href: "/subprocessors",
    label: "Subprocessors",
    description: "Third-party processors and operational infrastructure used by the app."
  }
] as const;

export const subprocessorEntries = [
  {
    vendor: "Vercel",
    role: "Application hosting, edge delivery, and runtime infrastructure",
    data: "Application traffic, request metadata, and deployed site content.",
    status: "Active"
  },
  {
    vendor: "Neon / managed Postgres",
    role: "Primary application database",
    data: "Accounts, workspaces, business profiles, generated artifacts, support requests, and deletion requests.",
    status: "Active when a remote database is configured"
  },
  {
    vendor: "OpenAI",
    role: "Optional AI-assisted snapshot refinement",
    data: "Business intake and heuristic diagnostic context when AI enhancement is enabled for a deployment.",
    status: "Optional"
  },
  {
    vendor: "Resend",
    role: "Optional transactional email delivery",
    data: "Account email addresses and message content for verification, reset, invite, and support-related notifications.",
    status: "Optional"
  },
  {
    vendor: "Stripe",
    role: "Optional checkout and billing infrastructure",
    data: "Customer email, billing identifiers, and payment events when billing is enabled.",
    status: "Optional and disabled on many preview deployments"
  },
  {
    vendor: "Cloudflare Turnstile",
    role: "Optional abuse and spam protection on public forms",
    data: "Form interaction metadata required to validate a challenge response.",
    status: "Optional"
  },
  {
    vendor: "PostHog",
    role: "Optional product analytics",
    data: "Usage events and product interaction telemetry when analytics is enabled.",
    status: "Optional"
  }
] as const;
