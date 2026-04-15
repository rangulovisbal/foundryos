import { type BusinessIntake, type SnapshotPriority, type SnapshotReport } from "@/lib/types";

const bottleneckCopy: Record<
  BusinessIntake["biggestBottleneck"],
  {
    headline: string;
    focus: string[];
    quickWins: string[];
    automations: string[];
    risks: string[];
  }
> = {
  "growth-clarity": {
    headline: "The business has momentum, but not a clear operating system.",
    focus: [
      "Clarify the growth model and leading indicators.",
      "Translate strategy into a 30-day execution cadence.",
      "Turn ad hoc decisions into a repeatable playbook."
    ],
    quickWins: [
      "Define one ICP and one headline promise for the next 30 days.",
      "Ship a simple weekly growth review with three KPIs.",
      "Turn the current offer into a one-page decision memo."
    ],
    automations: [
      "Weekly KPI digest from analytics into Slack or email.",
      "Lead capture scoring in CRM with routing rules.",
      "Auto-generated weekly plan from channel performance."
    ],
    risks: [
      "The team keeps shipping without a shared priority model.",
      "Channel activity grows, but learnings remain fragmented."
    ]
  },
  "manual-operations": {
    headline: "Operations are absorbing too much founder time.",
    focus: [
      "Document the repetitive work that blocks scale.",
      "Standardize handoffs across sales, delivery and support.",
      "Automate high-frequency workflows first."
    ],
    quickWins: [
      "List the top five manual tasks consuming more than one hour per week.",
      "Create the first SOP for onboarding or delivery.",
      "Set one source of truth for tasks, status and blockers."
    ],
    automations: [
      "Form-to-database intake automation.",
      "Client onboarding sequence after payment.",
      "Support triage tags and autoresponses."
    ],
    risks: [
      "Growth increases chaos instead of capacity.",
      "Key steps depend on memory instead of systems."
    ]
  },
  messaging: {
    headline: "The offer exists, but the narrative is too weak to convert fast.",
    focus: [
      "Sharpen the value proposition.",
      "Reduce positioning ambiguity.",
      "Align homepage, outbound and onboarding around one commercial angle."
    ],
    quickWins: [
      "Rewrite the hero section around one buyer pain.",
      "Replace generic copy with proof and operating outcomes.",
      "Create a tighter problem-agitation-solution script."
    ],
    automations: [
      "AI-assisted landing page audit workflow.",
      "Message consistency checker for outbound and website copy.",
      "Auto-generation of sector-specific use cases."
    ],
    risks: [
      "Traffic arrives but does not understand what is being sold.",
      "Sales calls spend too much time explaining basics."
    ]
  },
  "funnel-conversion": {
    headline: "Demand exists, but the funnel is leaking too early.",
    focus: [
      "Reduce friction between visit, interest and action.",
      "Add proof, pricing clarity and clear next steps.",
      "Instrument the funnel before scaling acquisition."
    ],
    quickWins: [
      "Add one primary CTA and one supporting CTA to key pages.",
      "Clarify plan boundaries and expected outcomes.",
      "Instrument visit-to-lead and lead-to-checkout events."
    ],
    automations: [
      "Lead magnet delivery plus nurture sequence.",
      "Abandoned checkout recovery.",
      "Lead qualification scoring before demos."
    ],
    risks: [
      "More traffic amplifies inefficiency instead of revenue.",
      "The team cannot explain why opportunities are being lost."
    ]
  },
  analytics: {
    headline: "Decisions are being made with incomplete operating visibility.",
    focus: [
      "Define the minimum metrics layer.",
      "Create a monthly rhythm for decision-making.",
      "Connect acquisition, activation and retention signals."
    ],
    quickWins: [
      "Track the three metrics that indicate first value.",
      "Set one dashboard for acquisition, activation and pipeline.",
      "Review channel performance once per week."
    ],
    automations: [
      "Automated KPI summaries.",
      "Monthly refresh report with movement highlights.",
      "Alerting when key conversion metrics drop."
    ],
    risks: [
      "Execution keeps moving, but nobody knows what improved.",
      "The team overreacts to anecdotes instead of signals."
    ]
  },
  "team-capacity": {
    headline: "The team needs more leverage before it needs more headcount.",
    focus: [
      "Protect team bandwidth with clear priorities.",
      "Reduce founder dependency.",
      "Turn expert judgment into reusable systems."
    ],
    quickWins: [
      "Define who owns each weekly priority.",
      "Create a playbook for the most repeated task.",
      "Move status reporting into one async routine."
    ],
    automations: [
      "Task creation from intake forms or support requests.",
      "Async reporting for delivery, growth and product.",
      "AI-generated drafts for recurring customer outputs."
    ],
    risks: [
      "Hiring happens before the operating model is fixed.",
      "Important work is delayed because everything feels urgent."
    ]
  }
};

const stageScore: Record<BusinessIntake["stage"], number> = {
  "pre-revenue": -8,
  validated: 8,
  growing: 14,
  established: 18
};

const teamScore: Record<BusinessIntake["teamSize"], number> = {
  solo: -4,
  "2-5": 4,
  "6-10": 8,
  "11-20": 12,
  "20+": 8
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getMaturity(score: number): SnapshotReport["maturity"] {
  if (score < 55) return "Early";
  if (score < 70) return "Developing";
  if (score < 85) return "Structured";
  return "Scaling";
}

function getRecommendedPlan(
  score: number,
  teamSize: BusinessIntake["teamSize"]
): SnapshotReport["recommendedPlan"] {
  if (score < 60) return "AI Snapshot";
  if (score >= 82 || teamSize === "11-20" || teamSize === "20+") {
    return "AI Operator";
  }
  return "FoundryOS Core";
}

function buildPriorities(intake: BusinessIntake): SnapshotPriority[] {
  const priorities: SnapshotPriority[] = [
    {
      title: "Lock a 30-day operating scoreboard",
      impact: "High",
      effort: "Medium",
      owner: "Founder / Growth lead",
      rationale:
        "Every decision should map to one visible growth and ops system."
    }
  ];

  if (intake.biggestBottleneck === "manual-operations") {
    priorities.push(
      {
        title: "Document the first three SOPs",
        impact: "High",
        effort: "Medium",
        owner: "Founder / Ops owner",
        rationale:
          "The fastest margin improvement comes from standardizing repeated work."
      },
      {
        title: "Automate intake-to-delivery handoffs",
        impact: "High",
        effort: "Medium",
        owner: "Ops / Freelance dev",
        rationale:
          "Removing manual handoffs reduces response time and founder dependency."
      }
    );
  } else if (intake.biggestBottleneck === "messaging") {
    priorities.push(
      {
        title: "Rewrite the commercial narrative",
        impact: "High",
        effort: "Low",
        owner: "Founder / Brand lead",
        rationale:
          "The offer is easier to sell when the pain, promise and outcome are explicit."
      },
      {
        title: "Create one proof-backed use case page",
        impact: "Medium",
        effort: "Medium",
        owner: "Founder / Content",
        rationale:
          "Buyers need a fast mental model of who the product is for."
      }
    );
  } else if (intake.biggestBottleneck === "analytics") {
    priorities.push(
      {
        title: "Instrument activation and conversion events",
        impact: "High",
        effort: "Medium",
        owner: "Product / Dev",
        rationale:
          "Without instrumentation, product improvement becomes guesswork."
      },
      {
        title: "Ship a monthly decision review",
        impact: "Medium",
        effort: "Low",
        owner: "Founder",
        rationale:
          "A consistent review loop forces clarity and keeps execution honest."
      }
    );
  } else {
    priorities.push(
      {
        title: "Focus the offer around one ICP and one promise",
        impact: "High",
        effort: "Low",
        owner: "Founder",
        rationale:
          "A tighter wedge improves acquisition, onboarding and retention at once."
      },
      {
        title: "Build the next 30-day execution plan",
        impact: "High",
        effort: "Medium",
        owner: "Founder / Growth lead",
        rationale:
          "The business needs a clear operating cadence, not more scattered effort."
      }
    );
  }

  return priorities;
}

function buildSuggestedStack(intake: BusinessIntake): string[] {
  const baseline = [
    "Next.js + Vercel",
    "Supabase for auth and data",
    "Stripe Billing for subscriptions",
    "PostHog for product analytics",
    "n8n for workflow automation"
  ];

  if (!intake.hasAnalytics) {
    baseline.push("PostHog dashboards for activation and funnel tracking");
  }

  if (!intake.hasDocumentedSOPs) {
    baseline.push("Internal SOP library with async templates");
  }

  if (intake.openToAutomation) {
    baseline.push("OpenAI routing layer with GPT-5.4 mini for repeatable tasks");
  }

  return baseline;
}

export function generateSnapshotReport(intake: BusinessIntake): SnapshotReport {
  const bottleneck = bottleneckCopy[intake.biggestBottleneck];

  let score = 52;
  score += stageScore[intake.stage];
  score += teamScore[intake.teamSize];
  score += intake.hasAnalytics ? 8 : -4;
  score += intake.hasDocumentedSOPs ? 10 : -6;
  score += intake.openToAutomation ? 6 : 0;
  score += intake.website ? 4 : 0;

  if (intake.primaryGoal === "build-system" || intake.primaryGoal === "reduce-ops-load") {
    score += 4;
  }

  score = clamp(score, 34, 92);

  const maturity = getMaturity(score);
  const recommendedPlan = getRecommendedPlan(score, intake.teamSize);

  return {
    score,
    maturity,
    headline: bottleneck.headline,
    summary: `${intake.companyName} is in a ${maturity.toLowerCase()} operating stage. The immediate opportunity is to tighten ${intake.primaryGoal.replaceAll("-", " ")} while removing the drag caused by ${intake.biggestBottleneck.replaceAll("-", " ")}.`,
    recommendedPlan,
    quickWins: bottleneck.quickWins,
    risks: bottleneck.risks,
    suggestedStack: buildSuggestedStack(intake),
    automationOpportunities: bottleneck.automations,
    monthlyFocus: bottleneck.focus,
    priorities: buildPriorities(intake)
  };
}

export const sampleIntake: BusinessIntake = {
  companyName: "Foundry Pulse",
  website: "https://foundrypulse.example",
  businessType: "saas",
  stage: "validated",
  teamSize: "2-5",
  primaryGoal: "build-system",
  biggestBottleneck: "manual-operations",
  mainChannel: "LinkedIn and referrals",
  currentTools: "Notion, Stripe, HubSpot, Calendly",
  monthlyRevenueBand: "EUR8k-EUR20k MRR",
  hasDocumentedSOPs: false,
  hasAnalytics: true,
  openToAutomation: true,
  notes:
    "Founder-led SaaS with product-market fit signals, but too much delivery work still happens manually."
};
