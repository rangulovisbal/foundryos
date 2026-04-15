import { Resend } from "resend";

import type { LeadRecord } from "@/lib/leads";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendTransactionalEmail({
  to,
  subject,
  text
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;

  if (!resend || !from) {
    return { delivered: false, reason: "resend-not-configured" as const };
  }

  await resend.emails.send({
    from,
    to,
    subject,
    text
  });

  return { delivered: true as const };
}

export async function sendLeadNotifications(lead: LeadRecord) {
  const to = process.env.RESEND_TO_EMAIL;

  if (!to) {
    return { delivered: false, reason: "resend-not-configured" as const };
  }

  const summary = [
    `Lead: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Website: ${lead.website || "n/a"}`,
    `Team size: ${lead.teamSize}`,
    `Source: ${lead.source}`,
    `Message: ${lead.message}`
  ].join("\n");

  await Promise.all([
    sendTransactionalEmail({
      to,
      subject: `New FoundryOS lead: ${lead.company}`,
      text: summary
    }),
    sendTransactionalEmail({
      to: lead.email,
      subject: "We received your FoundryOS request",
      text: `Thanks ${lead.name}, we received your request and will review it shortly.\n\nSummary:\n${summary}`
    })
  ]);

  return { delivered: true as const };
}
