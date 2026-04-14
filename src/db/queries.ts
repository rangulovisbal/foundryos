import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { leads, subscriptions } from "@/db/schema";
import type { LeadRecord } from "@/lib/leads";
import { appendLocalLead, appendLocalSubscription, readLocalLeads } from "@/lib/local-store";

type SubscriptionInsert = {
  email: string | null;
  company: string | null;
  planId: string | null;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  metadata?: Record<string, unknown>;
};

export async function createLeadRecord(record: LeadRecord) {
  const db = getDb();

  if (!db) {
    await appendLocalLead(record);
    return { storage: "local" as const, record };
  }

  await db.insert(leads).values({
    id: record.id,
    name: record.name,
    email: record.email,
    company: record.company,
    website: record.website || null,
    teamSize: record.teamSize,
    message: record.message,
    source: record.source,
    status: record.status,
    consent: record.consent,
    snapshotRequested: record.snapshotRequested,
    turnstileVerified: record.turnstileVerified,
    utmSource: record.utmSource || null,
    utmMedium: record.utmMedium || null,
    utmCampaign: record.utmCampaign || null
  });

  return { storage: "neon" as const, record };
}

export async function listLeadRecords() {
  const db = getDb();

  if (!db) {
    return {
      storage: "local" as const,
      items: await readLocalLeads()
    };
  }

  const items = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return { storage: "neon" as const, items };
}

export async function upsertSubscriptionRecord(record: SubscriptionInsert) {
  const db = getDb();

  if (!db) {
    await appendLocalSubscription({
      ...record,
      createdAt: new Date().toISOString()
    });
    return { storage: "local" as const };
  }

  if (record.stripeSubscriptionId) {
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, record.stripeSubscriptionId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(subscriptions)
        .set({
          email: record.email,
          company: record.company,
          planId: record.planId,
          status: record.status,
          stripeCustomerId: record.stripeCustomerId,
          metadata: record.metadata ?? null,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.stripeSubscriptionId, record.stripeSubscriptionId));

      return { storage: "neon" as const };
    }
  }

  await db.insert(subscriptions).values({
    email: record.email,
    company: record.company,
    planId: record.planId,
    status: record.status,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    metadata: record.metadata ?? null
  });

  return { storage: "neon" as const };
}
