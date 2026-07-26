"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { buildVCard } from "@/lib/vcard";
import { LEGIT_CHECKLIST } from "@/lib/legitChecklist";

type Profile = {
  business_name: string | null;
  business_type: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  social_links: string | null;
};

type Stats = {
  itemCount: number;
  soldCount: number;
  totalProfit: number;
  invoiceCount: number;
  paidCount: number;
};

type BudgetSummary = {
  totalStartup: number;
  monthlyNet: number;
  breakevenMonths: number | null;
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function sumLineItems(items: { amount: string }[]) {
  return items.reduce((total, i) => total + (parseFloat(i.amount) || 0), 0);
}

export default function DashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    itemCount: 0,
    soldCount: 0,
    totalProfit: 0,
    invoiceCount: 0,
    paidCount: 0,
  });
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [legitDone, setLegitDone] = useState(0);
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

      const [
        { data: profileData },
        { data: items },
        { data: invoices },
        { data: budgetPlan },
        { data: checklistProgress },
      ] = await Promise.all([
        supabase
          .from("business_profile")
          .select(
            "business_name, business_type, logo_url, address, phone, website, social_links"
          )
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
        supabase
          .from("budget_plans")
          .select("startup_costs, monthly_burn, monthly_revenue")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("business_checklist")
          .select("completed_items")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      setProfile(profileData ?? null);
      setHasProfile(!!profileData);

      if (profileData) {
        try {
          const dataUrl = await QRCode.toDataURL(buildVCard(profileData), {
            width: 200,
            margin: 1,
          });
          setQrDataUrl(dataUrl);
        } catch {
          setQrDataUrl(null);
        }
      }

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

      if (budgetPlan) {
        const startupCosts =
          (budgetPlan.startup_costs as { amount: string }[]) ?? [];
        const monthlyBurn =
          (budgetPlan.monthly_burn as { amount: string }[]) ?? [];
        const totalStartup = sumLineItems(startupCosts);
        const totalBurn = sumLineItems(monthlyBurn);
        const monthlyNet = (budgetPlan.monthly_revenue ?? 0) - totalBurn;
        const breakevenMonths =
          monthlyNet > 0 ? Math.ceil(totalStartup / monthlyNet) : null;
        setBudget({ totalStartup, monthlyNet, breakevenMonths });
      }

      if (checklistProgress) {
        setLegitDone(
          ((checklistProgress.completed_items as string[]) ?? []).length
        );
      }

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
      done: hasProfile,
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
    {
      label: "Run your budget numbers",
      done: !!budget,
      href: "/dashboard/budget",
    },
    {
      label: "Start the getting-legit checklist",
      done: legitDone > 0,
      href: "/dashboard/legit",
    },
  ];

  const displayName = profile?.business_name || (hasProfile ? "Unnamed business" : "Set up your business");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Business card */}
      <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        {profile?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo_url}
            alt={displayName}
            className="h-14 w-14 rounded object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded bg-neutral-200 text-lg font-semibold text-neutral-500">
            {displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-neutral-900">
            {displayName}
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

      {/* Budget summary */}
      {budget && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              Budget
            </h2>
            <Link
              href="/dashboard/budget"
              className="text-xs font-medium text-neutral-600 underline"
            >
              Edit
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-neutral-500">Startup costs</dt>
              <dd className="text-base font-semibold text-neutral-900">
                {currency(budget.totalStartup)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Monthly profit</dt>
              <dd
                className={`text-base font-semibold ${
                  budget.monthlyNet >= 0
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {currency(budget.monthlyNet)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Breakeven</dt>
              <dd className="text-base font-semibold text-neutral-900">
                {budget.breakevenMonths === null
                  ? "Not yet"
                  : `${budget.breakevenMonths} mo`}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Getting legit summary */}
      {legitDone > 0 && (
        <div className="rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              Getting legit
            </h2>
            <Link
              href="/dashboard/legit"
              className="text-xs font-medium text-neutral-600 underline"
            >
              View checklist
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${(legitDone / LEGIT_CHECKLIST.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-neutral-500">
              {legitDone}/{LEGIT_CHECKLIST.length}
            </span>
          </div>
        </div>
      )}

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

      {/* QR code */}
      {hasProfile && qrDataUrl && (
        <div className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR code for your business card"
            className="h-24 w-24 flex-shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-neutral-700">
              Your business QR code
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Scan it to save your business as a contact — great for
              pop-ups, markets, or in-person handoffs.
            </p>
            <a
              href={qrDataUrl}
              download="tailred-business-qr.png"
              className="mt-2 inline-block text-xs font-medium text-neutral-700 underline"
            >
              Download QR code
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
