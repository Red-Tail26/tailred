import Stripe from "stripe";

// Server-only — never import this into a "use client" file.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Tailred's cut per transaction, per the monetization model — only
// activates once the operator is actually getting paid.
export const APPLICATION_FEE_RATE = 0.02;
