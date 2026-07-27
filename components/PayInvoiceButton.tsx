"use client";

import { useState } from "react";

export default function PayInvoiceButton({
  invoiceId,
  amountLabel,
}: {
  invoiceId: string;
  amountLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not start payment.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Redirecting to Stripe…" : `Pay ${amountLabel} now`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
