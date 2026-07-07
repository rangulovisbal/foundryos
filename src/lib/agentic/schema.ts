import { z } from "zod";

export const Dimension = z.enum([
  "offer",
  "audience",
  "message",
  "channel",
  "conversion",
  "social_proof",
  "measurement"
]);

export const DimensionScore = z.object({
  dimension: Dimension,
  score: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  finding: z.string(),
  evidence_gap: z.string().nullable()
});

export const PlanTask = z.object({
  title: z.string(),
  why: z.string(),
  effort: z.enum(["S", "M", "L"]),
  done_when: z.string()
});

export const PlanWeek = z.object({
  week: z.number().int().min(1).max(4),
  focus: z.string(),
  tasks: z.array(PlanTask).min(1).max(5)
});

export const Asset = z.object({
  type: z.enum(["one_liner", "cta", "headline", "content_idea", "email"]),
  text: z.string()
});

export const Sop = z.object({
  name: z.string(),
  steps: z.array(z.string()).min(2)
});

export const FounderAnswer = z.object({
  question: z.string(),
  answer: z.string()
});

export const DiagnosisOutput = z.object({
  summary: z.string(),
  overall_confidence: z.enum(["low", "medium", "high"]),
  scores: z.array(DimensionScore).length(7),
  top_bottlenecks: z.array(z.string()).min(1).max(3),
  plan_30d: z.array(PlanWeek).length(4),
  assets: z.array(Asset).min(3),
  sops: z.array(Sop).min(1),
  founder_answers: z.array(FounderAnswer).default([])
});

export type DiagnosisOutput = z.infer<typeof DiagnosisOutput>;

export type IntakeProfile = {
  businessName: string;
  offer: string;
  audience: string;
  channels: string[];
  goals: string[];
  evidence: string[];
  language: "en" | "es";
};
