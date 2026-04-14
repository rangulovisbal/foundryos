import type { LeadRecord } from "@/lib/leads";
import { readJsonArray, resolveDataFile, writeJsonArray } from "@/lib/local-json";

const LEADS_PATH = resolveDataFile("leads.json");
const SUBSCRIPTIONS_PATH = resolveDataFile("subscriptions.json");

type SubscriptionRecord = {
  email: string | null;
  company: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planId: string | null;
  status: string;
  createdAt: string;
};

export async function readLocalLeads() {
  return readJsonArray<LeadRecord>(LEADS_PATH);
}

export async function appendLocalLead(lead: LeadRecord) {
  const leads = await readLocalLeads();
  leads.unshift(lead);
  await writeJsonArray(LEADS_PATH, leads);
}

export async function readLocalSubscriptions() {
  return readJsonArray<SubscriptionRecord>(SUBSCRIPTIONS_PATH);
}

export async function appendLocalSubscription(record: SubscriptionRecord) {
  const subscriptions = await readLocalSubscriptions();
  subscriptions.unshift(record);
  await writeJsonArray(SUBSCRIPTIONS_PATH, subscriptions);
}
