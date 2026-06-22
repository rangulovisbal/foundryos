import { env } from "@/lib/env";

export type PlanId = "snapshot" | "growth-os" | "operator";

export const pricingPlans = [
  {
    id: "snapshot" as const,
    name: "FoundryOS Starter",
    price: "Free",
    cadence: "self-serve starter",
    description:
      "A free starter marketing diagnosis and first 30-day plan for early-stage teams that need clarity fast.",
    checkoutEnabled: false,
    ctaLabel: "Start free"
  },
  {
    id: "growth-os" as const,
    name: "FoundryOS Core",
    price: "Monthly",
    cadence: "self-serve subscription",
    description:
      "Recurring marketing planning layer with refreshed priorities, asset drafting, workflow support, and monthly follow-through.",
    checkoutEnabled: true,
    ctaLabel: "Start monthly"
  },
  {
    id: "operator" as const,
    name: "FoundryOS Assisted",
    price: "Assisted",
    cadence: "assisted subscription",
    description:
      "Assisted rollout for teams that need deeper marketing implementation, integrations, and active workflow support.",
    checkoutEnabled: true,
    ctaLabel: "Start assisted"
  }
];

export function getStripePriceId(planId: PlanId) {
  switch (planId) {
    case "snapshot":
      return process.env.STRIPE_PRICE_SNAPSHOT;
    case "growth-os":
      return process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_GROWTH_OS;
    case "operator":
      return process.env.STRIPE_PRICE_ASSISTED || process.env.STRIPE_PRICE_OPERATOR;
    default:
      return undefined;
  }
}

export function isPlanCheckoutConfigured(planId: PlanId) {
  return Boolean(env.stripeCheckoutEnabled && getStripePriceId(planId));
}
