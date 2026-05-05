import type { BusinessIntake, SnapshotReport } from "@/lib/types";

export const bodyIntakeDefaults: BusinessIntake = {
  companyName: "FoundryOS lead",
  website: "",
  businessType: "saas",
  stage: "validated",
  teamSize: "2-5",
  primaryGoal: "build-system",
  biggestBottleneck: "manual-operations",
  mainChannel: "SEO and LinkedIn",
  currentTools: "Notion, Airtable, Stripe",
  monthlyRevenueBand: "EUR5k-EUR15k",
  hasDocumentedSOPs: false,
  hasAnalytics: true,
  openToAutomation: true,
  notes: ""
};

export function buildEmptyReport(companyName: string): SnapshotReport {
  return {
    score: 0,
    maturity: "Early",
    headline: "The marketing snapshot could not be generated.",
    summary: `${companyName} needs a retry. Check the API route or environment configuration before generating the marketing diagnosis again.`,
    recommendedPlan: "AI Snapshot",
    quickWins: ["Retry the intake request after validating the API route."],
    risks: ["The diagnosis engine is unavailable until the request succeeds."],
    suggestedStack: ["Check local environment variables and API route status."],
    automationOpportunities: ["Reconnect the report route or keep the current heuristic marketing mode."],
    monthlyFocus: ["Validate the request payload and route response."],
    priorities: [
      {
        title: "Restore marketing snapshot generation",
        impact: "High",
        effort: "Low",
        owner: "Product / Dev",
        rationale:
          "The product needs a functioning intake-to-report flow before the marketing diagnosis can be used reliably."
      }
    ]
  };
}
