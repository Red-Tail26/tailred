import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Server-only. Always asks Stripe directly whether a session actually
// got paid before writing anything — never trusts a client-supplied
// "it worked" signal (a query param, a redirect, etc).
export async function verifyAndMarkPaid(
  sessionId: string
): Promise<{ paid: boolean; invoiceId?: string; error?: string }> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { paid: false };
  }

  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) {
    return { paid: false, error: "Session has no invoice reference." };
  }

  const admin = createAdminClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, status")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    return { paid: false, error: "Invoice not found." };
  }

  // Idempotent — a page refresh or double-call shouldn't error or
  // re-trigger anything, just confirm what's already true.
  if (invoice.status !== "paid") {
    const { error: updateError } = await admin
      .from("invoices")
      .update({
        status: "paid",
        date_paid: new Date().toISOString().slice(0, 10),
      })
      .eq("id", invoiceId);

    if (updateError) {
      return { paid: false, error: updateError.message };
    }
  }

  return { paid: true, invoiceId };
}
