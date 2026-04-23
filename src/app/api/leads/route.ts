import { createLeadRecord } from "@/db/queries";
import { verifyTurnstile } from "@/lib/cloudflare";
import { sendLeadNotifications } from "@/lib/email";
import { getClientIp, noStoreJson, publicErrorJson } from "@/lib/http";
import { type LeadRecord, leadCaptureSchema } from "@/lib/leads";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`lead:${ip}`, {
      max: 6,
      windowMs: 60_000
    });

    if (!rateLimit.success) {
      return noStoreJson(
        { error: "Too many lead submissions. Try again shortly." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const payload = leadCaptureSchema.parse(json);
    const turnstile = await verifyTurnstile({
      token: payload.turnstileToken,
      ip
    });

    if (!turnstile.ok) {
      return noStoreJson(
        { error: "Bot verification failed. Please retry." },
        { status: 400 }
      );
    }

    const lead: LeadRecord = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      company: payload.company,
      website: payload.website,
      teamSize: payload.teamSize,
      message: payload.message,
      source: payload.source,
      consent: payload.consent,
      snapshotRequested: payload.snapshotRequested,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      createdAt: new Date().toISOString(),
      status: "new",
      turnstileVerified: turnstile.ok
    };

    await createLeadRecord(lead);
    await sendLeadNotifications(lead);

    return noStoreJson({
      ok: true,
      message: "Lead stored. We will review the request shortly."
    });
  } catch (error) {
    return publicErrorJson(error, "Lead submission failed.");
  }
}
