import { env } from "@/lib/env";

export type PlanId = "snapshot" | "growth-os" | "operator";

export const pricingPlans = [
  {
    id: "snapshot" as const,
    name: "Marketing Snapshot",
    price: "Free pilot",
    cadence: "assisted design partner",
    description:
      "A founder-assisted marketing diagnosis with clear gaps, priorities, and a first 30-day marketing plan for teams that need clarity fast.",
    checkoutEnabled: true,
    ctaLabel: "Request assisted pilot"
  },
  {
    id: "growth-os" as const,
    name: "FoundryOS Core",
    price: "Later",
    cadence: "future recurring plan",
    description:
      "Future recurring marketing planning layer with refreshed priorities, asset drafting, workflow support, and monthly follow-through after pilots prove the repeatable workflow.",
    checkoutEnabled: true,
    ctaLabel: "Request access"
  },
  {
    id: "operator" as const,
    name: "Marketing Operator",
    price: "Custom",
    cadence: "contact sales",
    description:
      "Custom rollout for teams that need deeper marketing implementation, integrations, and active workflow support.",
    checkoutEnabled: false,
    ctaLabel: "Talk to us"
  }
];

export function getStripePriceId(planId: PlanId) {
  switch (planId) {
    case "snapshot":
      return process.env.STRIPE_PRICE_SNAPSHOT;
    case "growth-os":
      return process.env.STRIPE_PRICE_GROWTH_OS;
    case "operator":
      return process.env.STRIPE_PRICE_OPERATOR;
    default:
      return undefined;
  }
}

export function isPlanCheckoutConfigured(planId: PlanId) {
  if (planId === "operator") {
    return false;
  }

  return Boolean(env.stripeCheckoutEnabled && getStripePriceId(planId));
}
