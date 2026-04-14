import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LeadRecord } from "@/lib/leads";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_PATH = path.join(DATA_DIR, "leads.json");
const SUBSCRIPTIONS_PATH = path.join(DATA_DIR, "subscriptions.json");

type SubscriptionRecord = {
  email: string | null;
  company: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planId: string | null;
  status: string;
  createdAt: string;
};

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filePath: string, payload: T[]) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function readLocalLeads() {
  return readJsonFile<LeadRecord>(LEADS_PATH);
}

export async function appendLocalLead(lead: LeadRecord) {
  const leads = await readLocalLeads();
  leads.unshift(lead);
  await writeJsonFile(LEADS_PATH, leads);
}

export async function readLocalSubscriptions() {
  return readJsonFile<SubscriptionRecord>(SUBSCRIPTIONS_PATH);
}

export async function appendLocalSubscription(record: SubscriptionRecord) {
  const subscriptions = await readLocalSubscriptions();
  subscriptions.unshift(record);
  await writeJsonFile(SUBSCRIPTIONS_PATH, subscriptions);
}
