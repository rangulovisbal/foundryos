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
    headline: "Snapshot could not be generated.",
    summary: `${companyName} needs a retry. Check the API route or environment configuration.`,
    recommendedPlan: "AI Snapshot",
    quickWins: ["Retry the intake request after validating the API route."],
    risks: ["The diagnostic engine is unavailable until the request succeeds."],
    suggestedStack: ["Check local environment variables and API route status."],
    automationOpportunities: ["Connect the route to OpenAI or keep heuristic mode."],
    monthlyFocus: ["Validate the request payload and route response."],
    priorities: [
      {
        title: "Restore snapshot generation",
        impact: "High",
        effort: "Low",
        owner: "Product / Dev",
        rationale:
          "The product needs a functioning intake-to-report flow before sales."
      }
    ]
  };
}
