import { z } from "zod";

export const businessTypeOptions = [
  "saas",
  "service",
  "agency",
  "ecommerce",
  "education",
  "other"
] as const;

export const stageOptions = [
  "pre-revenue",
  "validated",
  "growing",
  "established"
] as const;

export const teamSizeOptions = [
  "solo",
  "2-5",
  "6-10",
  "11-20",
  "20+"
] as const;

export const goalOptions = [
  "increase-demand",
  "improve-conversion",
  "launch-offers",
  "reduce-ops-load",
  "build-system"
] as const;

export const bottleneckOptions = [
  "growth-clarity",
  "manual-operations",
  "messaging",
  "funnel-conversion",
  "analytics",
  "team-capacity"
] as const;

export const businessIntakeSchema = z.object({
  companyName: z.string().min(2, "Company name is required."),
  website: z.string().url("Enter a valid URL.").or(z.literal("")),
  businessType: z.enum(businessTypeOptions),
  stage: z.enum(stageOptions),
  teamSize: z.enum(teamSizeOptions),
  primaryGoal: z.enum(goalOptions),
  biggestBottleneck: z.enum(bottleneckOptions),
  mainChannel: z.string().min(2, "Main channel is required."),
  currentTools: z.string().min(2, "Describe the current stack."),
  pricingModel: z.string().max(500).optional().default(""),
  typicalOrderValue: z.string().max(300).optional().default(""),
  hasDocumentedSOPs: z.boolean(),
  hasAnalytics: z.boolean(),
  openToAutomation: z.boolean(),
  notes: z.string().max(1200).optional().default("")
});

export type BusinessIntake = z.infer<typeof businessIntakeSchema>;

export const snapshotPrioritySchema = z.object({
  title: z.string().min(3).max(160),
  impact: z.enum(["High", "Medium"]),
  effort: z.enum(["Low", "Medium", "High"]),
  owner: z.string().min(2).max(120),
  rationale: z.string().min(12).max(280)
});

export type SnapshotPriority = {
  title: string;
  impact: "High" | "Medium";
  effort: "Low" | "Medium" | "High";
  owner: string;
  rationale: string;
};

export const snapshotReportSchema = z.object({
  score: z.number().int().min(0).max(100),
  maturity: z.enum(["Early", "Developing", "Structured", "Scaling"]),
  headline: z.string().min(12).max(180),
  summary: z.string().min(24).max(360),
  recommendedPlan: z.enum(["Marketing Snapshot", "FoundryOS Core", "Marketing Operator"]),
  quickWins: z.array(z.string().min(8).max(200)).min(3).max(5),
  risks: z.array(z.string().min(8).max(200)).min(2).max(4),
  suggestedStack: z.array(z.string().min(5).max(120)).min(3).max(6),
  automationOpportunities: z.array(z.string().min(8).max(200)).min(3).max(5),
  monthlyFocus: z.array(z.string().min(8).max(200)).min(3).max(5),
  priorities: z.array(snapshotPrioritySchema).min(3).max(5)
});

export type SnapshotReport = {
  score: number;
  maturity: "Early" | "Developing" | "Structured" | "Scaling";
  headline: string;
  summary: string;
  recommendedPlan: "Marketing Snapshot" | "FoundryOS Core" | "Marketing Operator";
  quickWins: string[];
  risks: string[];
  suggestedStack: string[];
  automationOpportunities: string[];
  monthlyFocus: string[];
  priorities: SnapshotPriority[];
};
