// POST /api/billing/webhook — Stripe webhook endpoint
// MUST verify Stripe signature before processing events.
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe-client";
import { handleWebhookEvent } from "@/lib/billing/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[WEBHOOK_VERIFY_ERROR]", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }
}
