import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// Never statically prerendered — always needs a real request/auth.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("business_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let accountId = profile?.stripe_account_id ?? null;

  if (!accountId) {
    // `type: "express"` is Stripe's deprecated shorthand — new platform
    // accounts don't have it enabled by default. `controller` is the
    // current, non-deprecated way to get the same result (Stripe-hosted
    // Express dashboard, Tailred pays Stripe's fees, Tailred bears loss
    // liability for its own application fee).
    const account = await stripe.accounts.create({
      controller: {
        stripe_dashboard: { type: "express" },
        fees: { payer: "application" },
        losses: { payments: "application" },
      },
      email: user.email,
    });
    accountId = account.id;

    const { error: upsertError } = await supabase
      .from("business_profile")
      .upsert(
        { user_id: user.id, stripe_account_id: accountId },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const origin = new URL(request.url).origin;

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/payments`,
    return_url: `${origin}/dashboard/payments?onboarding=return`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
