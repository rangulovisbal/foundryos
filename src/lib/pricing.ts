export type PlanId = "snapshot" | "growth-os" | "operator";

export const pricingPlans = [
  {
    id: "snapshot" as const,
    name: "AI Snapshot",
    price: "EUR79-EUR99",
    cadence: "one-off",
    description:
      "Diagnostic, score, quick wins and 30-day priorities for teams that need clarity fast."
  },
  {
    id: "growth-os" as const,
    name: "AI Growth OS",
    price: "EUR149-EUR249",
    cadence: "per month",
    description:
      "Recurring operating layer with monthly refresh, dashboard, SOPs and automation backlog."
  },
  {
    id: "operator" as const,
    name: "AI Operator",
    price: "EUR499-EUR999",
    cadence: "per month",
    description:
      "Higher-touch plan with connectors, active automations, reporting and priority support."
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
