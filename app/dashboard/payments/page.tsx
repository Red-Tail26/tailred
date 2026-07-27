"use client";

import { useEffect, useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

type Status = {
  connected: boolean;
  chargesEnabled: boolean;
  detailsSubmitted?: boolean;
};

export default function PaymentsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    const res = await fetch("/api/stripe/connect/status");
    if (res.ok) {
      setStatus(await res.json());
    } else {
      setError("Could not check your Stripe status.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);

    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setConnecting(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <BackToDashboard />
      <div>
        <h1 className="text-xl font-semibold">Get paid</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Connect your Stripe account so customers can pay your invoices
          directly. Money goes straight to you — Tailred never holds your
          funds, and takes a 2% fee only on payments you actually receive.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Checking your status…</p>
      ) : status?.chargesEnabled ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            ✓
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Connected and ready to accept payments
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Sent invoices will now show a &quot;Pay now&quot; button.
            </p>
          </div>
        </div>
      ) : status?.connected ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Almost there — Stripe needs a bit more info from you
          </p>
          <p className="mt-1 text-xs text-amber-700">
            You started connecting a Stripe account but haven&apos;t
            finished their onboarding yet.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="mt-3 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {connecting ? "Redirecting…" : "Finish connecting Stripe"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {connecting ? "Redirecting…" : "Connect with Stripe"}
        </button>
      )}

      <p className="text-xs text-neutral-400">
        Powered by Stripe Connect. You&apos;ll be taken to Stripe&apos;s own
        site to set up your account — Tailred never sees your bank details.
      </p>
    </div>
  );
}
