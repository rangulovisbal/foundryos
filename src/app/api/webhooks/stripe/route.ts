import { headers } from "next/headers";
import Stripe from "stripe";

import { updateWorkspace } from "@/db/foundation";
import { upsertSubscriptionRecord } from "@/db/queries";
import type { WorkspaceAccountState, WorkspacePlan } from "@/lib/foundation";
import { noStoreJson } from "@/lib/http";
import { getStripeClient } from "@/lib/payments";

export const runtime = "nodejs";

function resolvePlanId(priceId?: string | null) {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_SNAPSHOT) return "snapshot";
  if (
    priceId === process.env.STRIPE_PRICE_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_GROWTH_OS
  ) {
    return "growth-os";
  }
  if (
    priceId === process.env.STRIPE_PRICE_ASSISTED ||
    priceId === process.env.STRIPE_PRICE_OPERATOR
  ) {
    return "operator";
  }
  return null;
}

function normalizePlanId(value: unknown): WorkspacePlan | null {
  return value === "snapshot" || value === "growth-os" || value === "operator"
    ? value
    : null;
}

function stateForStripeSubscriptionStatus(
  status: Stripe.Subscription.Status | string | null | undefined
): WorkspaceAccountState {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "trial";
  }
}

async function updateWorkspaceFromStripe(input: {
  workspaceId?: string | null;
  planId?: string | null;
  subscriptionStatus?: Stripe.Subscription.Status | string | null;
}) {
  const plan = normalizePlanId(input.planId);
  const workspaceId = input.workspaceId?.trim();

  if (!workspaceId || !plan) {
    return;
  }

  await updateWorkspace(workspaceId, {
    plan,
    accountState: stateForStripeSubscriptionStatus(input.subscriptionStatus)
  });
}

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !stripe || !webhookSecret) {
    return noStoreJson(
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
        const planId =
          typeof object.metadata?.planId === "string"
            ? object.metadata.planId
            : null;
        const workspaceId =
          typeof object.metadata?.workspaceId === "string"
            ? object.metadata.workspaceId
            : object.client_reference_id;

        await upsertSubscriptionRecord({
          email: object.customer_details?.email ?? null,
          company:
            typeof object.metadata?.company === "string"
              ? object.metadata.company
              : null,
          planId,
          status: object.status ?? "completed",
          stripeCustomerId:
            typeof object.customer === "string" ? object.customer : null,
          stripeSubscriptionId:
            typeof object.subscription === "string" ? object.subscription : null,
          metadata: object.metadata ?? {}
        });
        await updateWorkspaceFromStripe({
          workspaceId,
          planId,
          subscriptionStatus: "active"
        });
      } else {
        const planId =
          normalizePlanId(object.metadata?.planId) ??
          resolvePlanId(object.items.data[0]?.price.id);
        const workspaceId =
          typeof object.metadata?.workspaceId === "string"
            ? object.metadata.workspaceId
            : null;

        await upsertSubscriptionRecord({
          email: null,
          company: null,
          planId,
          status: object.status,
          stripeCustomerId:
            typeof object.customer === "string" ? object.customer : null,
          stripeSubscriptionId: object.id,
          metadata: {
            cancelAtPeriodEnd: object.cancel_at_period_end,
            workspaceId
          }
        });
        await updateWorkspaceFromStripe({
          workspaceId,
          planId,
          subscriptionStatus: object.status
        });
      }
    }

    return noStoreJson({ received: true });
  } catch {
    return noStoreJson({ error: "Webhook verification failed." }, { status: 400 });
  }
}
