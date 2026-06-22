import Stripe from "stripe";

import type { PlanId } from "@/lib/pricing";
import { env } from "@/lib/env";
import { getStripePriceId } from "@/lib/pricing";

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession({
  planId,
  email,
  company,
  userId,
  workspaceId
}: {
  planId: PlanId;
  email?: string;
  company?: string;
  userId?: string;
  workspaceId?: string;
}) {
  if (!env.stripeCheckoutEnabled) {
    throw new Error(
      "Stripe checkout is not enabled on this deployment."
    );
  }

  const stripe = getStripeClient();
  const priceId = getStripePriceId(planId);

  if (!stripe || !priceId) {
    throw new Error("Stripe is not fully configured for this plan.");
  }

  if (planId === "snapshot") {
    throw new Error("The starter plan is free and does not require checkout.");
  }

  const mode = "subscription";
  const metadata = {
    planId,
    company: company ?? "",
    userId: userId ?? "",
    workspaceId: workspaceId ?? ""
  };
  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer_email: email,
    success_url: `${env.appUrl}/pricing?checkout=success&plan=${planId}`,
    cancel_url: `${env.appUrl}/pricing?checkout=cancelled&plan=${planId}`,
    client_reference_id: workspaceId,
    metadata,
    subscription_data: {
      metadata
    },
    billing_address_collection: "auto",
    allow_promotion_codes: true
  });

  return session;
}
