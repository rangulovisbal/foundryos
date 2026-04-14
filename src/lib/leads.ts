import { z } from "zod";

export const leadCaptureSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Valid email required."),
  company: z.string().min(2, "Company is required."),
  website: z.string().url("Enter a valid URL.").or(z.literal("")),
  teamSize: z.string().min(1, "Team size is required."),
  message: z.string().min(10, "Add enough context for follow-up."),
  source: z.string().min(1).default("website"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required." })
  }),
  snapshotRequested: z.boolean().default(true),
  utmSource: z.string().optional().default(""),
  utmMedium: z.string().optional().default(""),
  utmCampaign: z.string().optional().default(""),
  turnstileToken: z.string().optional().nullable()
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

export type LeadRecord = Omit<LeadCaptureInput, "turnstileToken"> & {
  id: string;
  status: "new" | "qualified" | "won" | "archived";
  createdAt: string;
  turnstileVerified: boolean;
};
