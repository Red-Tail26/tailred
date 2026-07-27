import Stripe from "stripe";

// Server-only — never import this into a "use client" file.
//
// Created lazily (not at module load) so a missing STRIPE_SECRET_KEY
// only breaks the Stripe routes when they're actually hit, not the
// entire build — Next.js imports every route module during the build's
// page-data-collection step, so a top-level `new Stripe(...)` would
// crash the whole deployment if the key isn't set yet.
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// Tailred's cut per transaction, per the monetization model — only
// activates once the operator is actually getting paid.
export const APPLICATION_FEE_RATE = 0.02;
