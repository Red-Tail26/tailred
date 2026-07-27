import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// Never statically prerendered — always needs a real request/auth.
export const dynamic = "force-dynamic";

export async function GET() {
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
    .select("stripe_account_id, stripe_charges_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, chargesEnabled: false });
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);

  if (account.charges_enabled !== profile.stripe_charges_enabled) {
    await supabase
      .from("business_profile")
      .update({ stripe_charges_enabled: account.charges_enabled })
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    connected: true,
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
  });
}
