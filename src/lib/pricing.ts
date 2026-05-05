export type PlanId = "snapshot" | "growth-os" | "operator";

export const pricingPlans = [
  {
    id: "snapshot" as const,
    name: "Marketing Snapshot",
    price: "€99",
    cadence: "one-off",
    description:
      "A paid marketing diagnosis with clear gaps, priorities, and a first 30-day marketing plan for teams that need clarity fast.",
    checkoutEnabled: true,
    ctaLabel: "Buy Marketing Snapshot"
  },
  {
    id: "growth-os" as const,
    name: "FoundryOS Core",
    price: "€199",
    cadence: "per month",
    description:
      "Recurring marketing planning layer with refreshed priorities, asset drafting, workflow support, and monthly follow-through.",
    checkoutEnabled: true,
    ctaLabel: "Start FoundryOS"
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

  return Boolean(process.env.STRIPE_SECRET_KEY && getStripePriceId(planId));
}
