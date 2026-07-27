import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyAndMarkPaid } from "@/lib/verifyPayment";
import PayInvoiceButton from "@/components/PayInvoiceButton";

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paid?: string; session_id?: string };
}) {
  const supabase = createClient();

  let justPaid = false;

  // Coming back from Stripe — verify with Stripe directly before trusting
  // anything, then the invoice fetch below will reflect the real status.
  if (searchParams.paid === "1" && searchParams.session_id) {
    const result = await verifyAndMarkPaid(searchParams.session_id);
    justPaid = result.paid;
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", params.id)
    .single();

  if (!invoice) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("business_profile")
    .select("*")
    .eq("user_id", invoice.user_id)
    .single();

  const items = (invoice.invoice_items ?? []) as {
    id: string;
    description: string | null;
    price: number;
    quantity: number;
  }[];
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const canPayOnline =
    invoice.status === "sent" && profile?.stripe_charges_enabled;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          {profile?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo_url}
              alt={profile.business_name}
              className="mb-2 h-10 w-10 rounded object-cover"
            />
          )}
          <h1 className="text-lg font-semibold">
            {profile?.business_name ?? "Invoice"}
          </h1>
          {profile?.address && (
            <p className="text-xs text-neutral-500">{profile.address}</p>
          )}
          {profile?.phone && (
            <p className="text-xs text-neutral-500">{profile.phone}</p>
          )}
          {profile?.website && (
            <p className="text-xs text-neutral-500">{profile.website}</p>
          )}
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
          {invoice.status}
        </span>
      </div>

      {justPaid && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-sm font-medium text-emerald-800">
            Payment received — thank you!
          </p>
        </div>
      )}

      <div>
        <p className="text-sm text-neutral-500">Billed to</p>
        <p className="text-sm font-medium text-neutral-900">
          {invoice.client_name}
        </p>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-100">
              <td className="py-2 text-neutral-900">{item.description}</td>
              <td className="py-2 text-neutral-500">{item.quantity}</td>
              <td className="py-2 text-right text-neutral-900">
                {currency(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between border-t border-neutral-200 pt-4 text-base font-semibold">
        <span>Total</span>
        <span>{currency(total)}</span>
      </div>

      {canPayOnline && (
        <PayInvoiceButton invoiceId={invoice.id} amountLabel={currency(total)} />
      )}

      {invoice.status !== "paid" && !canPayOnline && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
          Online payment isn&apos;t set up yet — this business will follow up
          on how to pay.
        </div>
      )}
    </main>
  );
}
