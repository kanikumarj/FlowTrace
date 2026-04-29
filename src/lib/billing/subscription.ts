// ─── Subscription Management ────────────────────────────────
// Creates checkout sessions, portal sessions, and manages plan upgrades.

import { stripe } from "./stripe-client";
import { prisma } from "@/lib/prisma";
import type { PlanTier } from "./plans";

const PRICE_IDS: Record<string, string> = {
  PRO_MONTH: process.env.STRIPE_PRO_PRICE_ID ?? "",
  ENTERPRISE_MONTH: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
};

export async function getOrCreateStripeCustomer(
  workspaceId: string
): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { owner: { select: { email: true, name: true } } },
  });

  if (workspace.stripeCustomerId) {
    return workspace.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: workspace.owner.email,
    name: workspace.owner.name ?? workspace.name,
    metadata: { workspaceId },
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(
  workspaceId: string,
  plan: "PRO" | "ENTERPRISE",
  interval: "month" | "year" = "month"
): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(workspaceId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const priceKey = `${plan}_${interval.toUpperCase()}`;
  const priceId = PRICE_IDS[priceKey] || PRICE_IDS[`${plan}_MONTH`];

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${plan} (${interval})`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/settings/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
    metadata: { workspaceId, plan },
    subscription_data: {
      metadata: { workspaceId, plan },
    },
  });

  return session.url ?? "";
}

export async function createPortalSession(
  workspaceId: string
): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
  });

  if (!workspace.stripeCustomerId) {
    throw new Error("No Stripe customer found for this workspace");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
  });

  return session.url;
}

export async function cancelSubscription(
  workspaceId: string
): Promise<void> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
  });

  if (!workspace.stripeSubscriptionId) {
    throw new Error("No active subscription to cancel");
  }

  await stripe.subscriptions.update(workspace.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

export function mapStripePlanToTier(priceId: string): PlanTier {
  if (priceId === PRICE_IDS.ENTERPRISE_MONTH) return "ENTERPRISE";
  if (priceId === PRICE_IDS.PRO_MONTH) return "PRO";
  return "FREE";
}
