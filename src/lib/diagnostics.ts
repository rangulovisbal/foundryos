import type {
  BusinessProfileRecord,
  DiagnosticCategoryScore,
  DiagnosticEvidenceCard,
  DiagnosticFinding,
  DiagnosticNextAction,
  DiagnosticOpportunity,
  DiagnosticResultRecord,
  WorkspaceRecord
} from "@/lib/foundation";

const categoryLabels = {
  positioning: "Positioning",
  acquisition: "Acquisition",
  operations: "Operations",
  data: "Data visibility",
  execution: "Execution cadence"
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function filled(value: string | null) {
  return Boolean(value?.trim());
}

function profileCompleteness(profile: BusinessProfileRecord) {
  const textFields = [
    profile.companyName,
    profile.website,
    profile.industry,
    profile.businessModel,
    profile.teamSize,
    profile.geography,
    profile.primaryOffer,
    profile.targetAudience,
    profile.budgetBand,
    profile.lifecycleStage
  ];
  const listFields = [
    profile.currentChannels,
    profile.currentTools,
    profile.primaryGoals,
    profile.biggestBottlenecks
  ];

  const filledText = textFields.filter(filled).length;
  const filledLists = listFields.filter((items) => items.length > 0).length;
  return Math.round(((filledText + filledLists) / (textFields.length + listFields.length)) * 100);
}

function scoreCategories(profile: BusinessProfileRecord): DiagnosticCategoryScore[] {
  const completeness = profileCompleteness(profile);
  const positioning = clamp(
    38 +
      (filled(profile.primaryOffer) ? 18 : 0) +
      (filled(profile.targetAudience) ? 18 : 0) +
      (filled(profile.industry) ? 8 : 0) +
      (profile.primaryGoals.length > 0 ? 8 : 0),
    20,
    92
  );
  const acquisition = clamp(
    34 +
      (filled(profile.website) ? 14 : 0) +
      profile.currentChannels.length * 8 +
      (filled(profile.geography) ? 6 : 0),
    20,
    90
  );
  const operations = clamp(
    35 +
      profile.currentTools.length * 7 +
      (filled(profile.teamSize) ? 8 : 0) +
      (profile.biggestBottlenecks.length > 0 ? 6 : 0),
    20,
    88
  );
  const data = clamp(
    28 +
      (profile.currentTools.some((tool) => /analytics|dashboard|crm|hubspot|posthog|ga4/i.test(tool))
        ? 22
        : 0) +
      (profile.currentChannels.length > 1 ? 12 : 0) +
      (profile.primaryGoals.length > 1 ? 10 : 0),
    18,
    86
  );
  const execution = clamp(
    36 +
      (profile.primaryGoals.length > 0 ? 14 : 0) +
      (profile.biggestBottlenecks.length > 0 ? 10 : 0) +
      (filled(profile.lifecycleStage) ? 8 : 0) +
      Math.round(completeness / 8),
    22,
    90
  );

  return [
    {
      key: "positioning",
      label: categoryLabels.positioning,
      score: positioning,
      rationale:
        filled(profile.primaryOffer) && filled(profile.targetAudience)
          ? "The offer and audience are defined enough to produce a focused operating plan."
          : "The diagnostic needs sharper offer and audience inputs before positioning can be trusted."
    },
    {
      key: "acquisition",
      label: categoryLabels.acquisition,
      score: acquisition,
      rationale:
        profile.currentChannels.length > 0
          ? "Current channels are visible, so the next step is prioritizing what to measure and improve."
          : "No channel mix is captured yet, which limits acquisition diagnosis."
    },
    {
      key: "operations",
      label: categoryLabels.operations,
      score: operations,
      rationale:
        profile.currentTools.length > 0
          ? "The current tool stack gives a starting point for handoffs, SOPs, and automation candidates."
          : "Operations are likely still undocumented because no tools or systems are captured."
    },
    {
      key: "data",
      label: categoryLabels.data,
      score: data,
      rationale:
        data >= 60
          ? "There is enough signal to start building a recurring measurement layer."
          : "Data visibility is still weak and should be treated as an early operating risk."
    },
    {
      key: "execution",
      label: categoryLabels.execution,
      score: execution,
      rationale:
        profile.primaryGoals.length > 0
          ? "Primary goals are captured, so FoundryOS can turn them into a short operating cadence."
          : "The workspace needs explicit goals before execution recommendations can be specific."
    }
  ];
}

function fallbackCompany(profile: BusinessProfileRecord, workspace: WorkspaceRecord) {
  return profile.companyName ?? workspace.name;
}

function buildBottlenecks(profile: BusinessProfileRecord): DiagnosticFinding[] {
  const explicit = profile.biggestBottlenecks.slice(0, 3).map((item) => ({
    title: item,
    detail: "Captured directly from the workspace business profile as a current operating constraint.",
    severity: "high" as const
  }));

  if (explicit.length > 0) {
    return explicit;
  }

  return [
    {
      title: "Incomplete operating context",
      detail:
        "The profile is missing bottleneck inputs, so the diagnostic cannot yet isolate the main constraint.",
      severity: "medium"
    }
  ];
}

function buildRisks(profile: BusinessProfileRecord): DiagnosticFinding[] {
  const risks: DiagnosticFinding[] = [];

  if (!filled(profile.targetAudience)) {
    risks.push({
      title: "Audience definition is not explicit",
      detail:
        "Without a clear target audience, roadmap and messaging recommendations can become too broad.",
      severity: "high"
    });
  }

  if (profile.currentTools.length < 2) {
    risks.push({
      title: "Operational visibility may depend on memory",
      detail:
        "Few tools are captured, which usually means handoffs, reporting, or ownership are not yet systemized.",
      severity: "medium"
    });
  }

  if (profile.currentChannels.length === 0) {
    risks.push({
      title: "Acquisition channels are not mapped",
      detail:
        "The system cannot yet tell which demand source should receive the next operating improvement.",
      severity: "medium"
    });
  }

  return risks.slice(0, 3);
}

function buildOpportunities(profile: BusinessProfileRecord): DiagnosticOpportunity[] {
  const opportunities: DiagnosticOpportunity[] = [
    {
      title: "Turn the profile into a 30-day operating cadence",
      detail:
        "Use the captured goals and bottlenecks to define weekly priorities, owners, and review checkpoints.",
      impact: "high"
    }
  ];

  if (profile.currentChannels.length > 0) {
    opportunities.push({
      title: "Prioritize the highest-signal channel",
      detail: `Start with ${profile.currentChannels[0]} and define the one metric that proves it is improving.`,
      impact: "high"
    });
  }

  if (profile.currentTools.length > 0) {
    opportunities.push({
      title: "Convert repeated work into SOP candidates",
      detail:
        "The current tool stack can be used to identify handoffs that should become templates or automations.",
      impact: "medium"
    });
  }

  return opportunities.slice(0, 3);
}

function buildActions(profile: BusinessProfileRecord): DiagnosticNextAction[] {
  return [
    {
      title: "Complete or confirm the business profile",
      detail:
        "Fill any missing context before using the diagnostic as a planning artifact for the team.",
      owner: "Owner or admin",
      timeframe: "Today"
    },
    {
      title: "Select the primary bottleneck for the next 30 days",
      detail:
        profile.biggestBottlenecks[0] ??
        "Choose the single constraint that would create the most leverage if improved.",
      owner: "Workspace owner",
      timeframe: "This week"
    },
    {
      title: "Create the first operating review",
      detail:
        "Turn score categories into a weekly review with one owner, one metric, and one action per category.",
      owner: "Founder or operator",
      timeframe: "Next 7 days"
    }
  ];
}

function buildEvidence(
  profile: BusinessProfileRecord,
  workspace: WorkspaceRecord
): DiagnosticEvidenceCard[] {
  return [
    {
      title: "Company context",
      observation: `${fallbackCompany(profile, workspace)} is captured as a ${profile.lifecycleStage ?? "preview-stage"} workspace.`,
      implication:
        "Diagnostics are scoped to the workspace profile and should be refreshed when the business context changes."
    },
    {
      title: "Operating inputs",
      observation: `${profile.currentChannels.length} channels, ${profile.currentTools.length} tools, and ${profile.primaryGoals.length} goals are currently captured.`,
      implication:
        "More structured inputs increase confidence and make recommendations less generic."
    },
    {
      title: "Plan boundary",
      observation: `The workspace is on the ${workspace.plan} plan key with account state ${workspace.accountState}.`,
      implication:
        "Usage and access are controlled by preview entitlements until live billing becomes the source of truth."
    }
  ];
}

export function buildDiagnosticResult({
  jobId,
  workspace,
  profile
}: {
  jobId: string;
  workspace: WorkspaceRecord;
  profile: BusinessProfileRecord;
}): DiagnosticResultRecord {
  const categoryScores = scoreCategories(profile);
  const overallMaturityScore = Math.round(
    categoryScores.reduce((total, item) => total + item.score, 0) /
      categoryScores.length
  );
  const completeness = profileCompleteness(profile);
  const confidence =
    completeness >= 78 ? "high" : completeness >= 45 ? "medium" : "low";
  const company = fallbackCompany(profile, workspace);

  return {
    id: crypto.randomUUID(),
    jobId,
    workspaceId: workspace.id,
    overallMaturityScore,
    categoryScores,
    topBottlenecks: buildBottlenecks(profile),
    topRisks: buildRisks(profile),
    topOpportunities: buildOpportunities(profile),
    confidence,
    recommendedNextActions: buildActions(profile),
    evidenceCards: buildEvidence(profile, workspace),
    summary:
      `${company} is currently scoring ${overallMaturityScore}/100. ` +
      "The next useful product step is to tighten the profile, select one bottleneck, " +
      "and turn the diagnostic into a short operating cadence.",
    createdAt: new Date().toISOString()
  };
}
