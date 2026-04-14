import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { upsertSubscriptionRecord } from "@/db/queries";
import { getStripeClient } from "@/lib/payments";

export const runtime = "nodejs";

function resolvePlanId(priceId?: string | null) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_SNAPSHOT) return "snapshot";
  if (priceId === process.env.STRIPE_PRICE_GROWTH_OS) return "growth-os";
  if (priceId === process.env.STRIPE_PRICE_OPERATOR) return "operator";
  return null;
}

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 400 }
    );
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const object = event.data.object as
        | Stripe.Checkout.Session
        | Stripe.Subscription;

      if ("mode" in object) {
        await upsertSubscriptionRecord({
          email: object.customer_details?.email ?? null,
          company:
            typeof object.metadata?.company === "string"
              ? object.metadata.company
              : null,
          planId:
            typeof object.metadata?.planId === "string"
              ? object.metadata.planId
              : null,
          status: object.status ?? "completed",
          stripeCustomerId:
            typeof object.customer === "string" ? object.customer : null,
          stripeSubscriptionId:
            typeof object.subscription === "string" ? object.subscription : null,
          metadata: object.metadata ?? {}
        });
      } else {
        await upsertSubscriptionRecord({
          email: null,
          company: null,
          planId: resolvePlanId(object.items.data[0]?.price.id),
          status: object.status,
          stripeCustomerId:
            typeof object.customer === "string" ? object.customer : null,
          stripeSubscriptionId: object.id,
          metadata: {
            cancelAtPeriodEnd: object.cancel_at_period_end
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook verification failed."
      },
      { status: 400 }
    );
  }
}
