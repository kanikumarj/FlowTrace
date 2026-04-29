// ─── Stripe Webhook Event Handler ────────────────────────────
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { resetMonthlyUsage } from "./usage-gate";

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const workspaceId = session.metadata?.workspaceId;
  const plan = session.metadata?.plan as "PRO" | "ENTERPRISE" | undefined;

  if (!workspaceId || !plan) {
    console.error("[Stripe Webhook] Missing metadata on checkout session");
    return;
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log(`[Stripe Webhook] Workspace ${workspaceId} upgraded to ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspaceId;
  if (!workspaceId) {
    const workspace = await prisma.workspace.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!workspace) return;
    await syncSubscription(workspace.id, subscription);
    return;
  }
  await syncSubscription(workspaceId, subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      plan: "FREE",
      subscriptionStatus: "CANCELED",
      stripeSubscriptionId: null,
      planExpiresAt: null,
    },
  });

  await prisma.usageRecord.updateMany({
    where: { workspaceId: workspace.id },
    data: { value: 0 },
  });

  console.log(`[Stripe Webhook] Workspace ${workspace.id} downgraded to FREE`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const inv = invoice as unknown as Record<string, unknown>;
  const rawSub = inv["subscription"];
  const subscriptionId = typeof rawSub === "string" ? rawSub : null;
  if (!subscriptionId) return;

  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { subscriptionStatus: "PAST_DUE" },
  });
  console.log(`[Stripe Webhook] Payment failed for workspace ${workspace.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const inv = invoice as unknown as Record<string, unknown>;
  const rawSub = inv["subscription"];
  const subscriptionId = typeof rawSub === "string" ? rawSub : null;
  if (!subscriptionId) return;

  const workspace = await prisma.workspace.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { subscriptionStatus: "ACTIVE" },
  });

  await resetMonthlyUsage(workspace.id);
  console.log(`[Stripe Webhook] Payment succeeded for workspace ${workspace.id}`);
}

async function syncSubscription(
  workspaceId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const plan = subscription.metadata?.plan as "PRO" | "ENTERPRISE" | undefined;
  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
  };

  const subscriptionStatus = statusMap[subscription.status] ?? "ACTIVE";

  // Access current_period_end safely
  const subObj = subscription as unknown as Record<string, unknown>;
  const periodEnd = subObj["current_period_end"];
  const currentPeriodEnd = typeof periodEnd === "number"
    ? new Date(periodEnd * 1000)
    : null;

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(plan && { plan }),
      subscriptionStatus,
      planExpiresAt: currentPeriodEnd,
      stripeSubscriptionId: subscription.id,
    },
  });
}
