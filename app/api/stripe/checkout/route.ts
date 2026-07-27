import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, APPLICATION_FEE_RATE } from "@/lib/stripe";

export async function POST(request: Request) {
  const { invoiceId } = await request.json();

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice id." }, { status: 400 });
  }

  // Anon client — relies on the existing public RLS policies (anyone
  // with the link can read a sent/paid invoice), same as the invoice
  // page itself. No elevated access needed just to read.
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, user_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (invoice.status !== "sent") {
    return NextResponse.json(
      { error: "This invoice isn't open for payment." },
      { status: 400 }
    );
  }

  const { data: lineItems } = await supabase
    .from("invoice_items")
    .select("description, price, quantity")
    .eq("invoice_id", invoiceId);

  if (!lineItems || lineItems.length === 0) {
    return NextResponse.json(
      { error: "This invoice has no line items." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("business_profile")
    .select("business_name, stripe_account_id, stripe_charges_enabled")
    .eq("user_id", invoice.user_id)
    .maybeSingle();

  if (!profile?.stripe_account_id || !profile.stripe_charges_enabled) {
    return NextResponse.json(
      { error: "This business hasn't set up payments yet." },
      { status: 400 }
    );
  }

  const totalCents = lineItems.reduce(
    (sum, l) => sum + Math.round(l.price * 100) * l.quantity,
    0
  );

  if (totalCents <= 0) {
    return NextResponse.json({ error: "Invoice total must be greater than $0." }, { status: 400 });
  }

  const applicationFeeAmount = Math.round(totalCents * APPLICATION_FEE_RATE);
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems.map((l) => ({
      price_data: {
        currency: "usd",
        product_data: { name: l.description || "Invoice item" },
        unit_amount: Math.round(l.price * 100),
      },
      quantity: l.quantity,
    })),
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: profile.stripe_account_id },
    },
    success_url: `${origin}/invoice/${invoiceId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/invoice/${invoiceId}`,
    metadata: { invoice_id: invoiceId },
  });

  // Record-keeping only — session.id came straight from our own
  // server-side Stripe call, not from the customer, so it's trustworthy;
  // still needs the admin client since anon has no invoices UPDATE policy.
  const admin = createAdminClient();
  await admin
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", invoiceId);

  return NextResponse.json({ url: session.url });
}
