"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
};

type Stats = {
  itemCount: number;
  soldCount: number;
  totalProfit: number;
  invoiceCount: number;
  paidCount: number;
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    itemCount: 0,
    soldCount: 0,
    totalProfit: 0,
    invoiceCount: 0,
    paidCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: profileData }, { data: items }, { data: invoices }] =
        await Promise.all([
          supabase
            .from("business_profile")
            .select("business_name, business_type, logo_url, address, phone, website")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("inventory_items")
            .select("status, sale_price, cogs")
            .eq("user_id", user.id),
          supabase
            .from("invoices")
            .select("status")
            .eq("user_id", user.id),
        ]);

      setProfile(profileData ?? null);

      const soldItems = (items ?? []).filter((i) => i.status === "sold");
      const totalProfit = soldItems.reduce(
        (sum, i) => sum + ((i.sale_price ?? 0) - i.cogs),
        0
      );

      setStats({
        itemCount: (items ?? []).length,
        soldCount: soldItems.length,
        totalProfit,
        invoiceCount: (invoices ?? []).length,
        paidCount: (invoices ?? []).filter((i) => i.status === "paid").length,
      });

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  const checklist = [
    {
      label: "Set up your business profile",
      done: !!profile?.business_name,
      href: "/onboarding",
    },
    {
      label: "Source your first item",
      done: stats.itemCount > 0,
      href: "/dashboard/inventory",
    },
    {
      label: "Mark an item sold",
      done: stats.soldCount > 0,
      href: "/dashboard/inventory",
    },
    {
      label: "Send your first invoice",
      done: stats.invoiceCount > 0,
      href: "/dashboard/invoices",
    },
    {
      label: "Get paid (Stripe Connect — coming soon)",
      done: stats.paidCount > 0,
      href: "/dashboard/invoices",
    },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Business card */}
      <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {profile?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo_url}
            alt={profile.business_name}
            className="h-14 w-14 rounded object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded bg-neutral-200 text-lg font-semibold text-neutral-500">
            {profile?.business_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-neutral-900">
            {profile?.business_name || "Set up your business"}
          </h1>
          <p className="text-sm text-neutral-500">
            {profile?.business_type || "No business type set yet"}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="text-xs font-medium text-neutral-600 underline"
        >
          Edit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Inventory items</p>
          <p className="text-lg font-semibold text-neutral-900">
            {stats.itemCount}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Items sold</p>
          <p className="text-lg font-semibold text-neutral-900">
            {stats.soldCount}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Total profit</p>
          <p className="text-lg font-semibold text-emerald-700">
            {currency(stats.totalProfit)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Invoices sent</p>
          <p className="text-lg font-semibold text-neutral-900">
            {stats.invoiceCount}
          </p>
        </div>
      </div>

      {/* Getting started checklist */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Getting started
        </h2>
        <ul className="flex flex-col gap-2">
          {checklist.map((step) => (
            <li key={step.label}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50"
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                    step.done
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-neutral-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span
                  className={`text-sm ${
                    step.done
                      ? "text-neutral-400 line-through"
                      : "text-neutral-900"
                  }`}
                >
                  {step.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
