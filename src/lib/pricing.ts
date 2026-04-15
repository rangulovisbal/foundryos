export type PlanId = "snapshot" | "growth-os" | "operator";

export const pricingPlans = [
  {
    id: "snapshot" as const,
    name: "AI Snapshot",
    price: "€99",
    cadence: "one-off",
    description:
      "A paid diagnostic with score, roadmap and first operating priorities for teams that need clarity fast.",
    checkoutEnabled: true,
    ctaLabel: "Buy AI Snapshot"
  },
  {
    id: "growth-os" as const,
    name: "FoundryOS Core",
    price: "€199",
    cadence: "per month",
    description:
      "Recurring operating layer with monthly refresh, dashboard, SOPs and automation backlog.",
    checkoutEnabled: true,
    ctaLabel: "Start FoundryOS"
  },
  {
    id: "operator" as const,
    name: "AI Operator",
    price: "Custom",
    cadence: "contact sales",
    description:
      "Custom rollout for teams that need integrations, active workflows and deeper implementation support.",
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

  return Boolean(process.env.STRIPE_SECRET_KEY && getStripePriceId(planId));
}
