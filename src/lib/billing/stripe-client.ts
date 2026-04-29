// ─── Stripe SDK Singleton ────────────────────────────────────
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Only throw at call-time, not at import-time — prevents build failures
// when env vars aren't yet set.
function getStripeClient(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(stripeSecretKey, { typescript: true });
}

let _stripe: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      _stripe = getStripeClient();
    }
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});
