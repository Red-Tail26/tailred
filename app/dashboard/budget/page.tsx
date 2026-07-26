"use client";

import { useEffect, useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";
import { createClient } from "@/lib/supabase/client";

type LineItem = { id: string; label: string; amount: string };

function newItem(label = ""): LineItem {
  return { id: crypto.randomUUID(), label, amount: "" };
}

function sum(items: LineItem[]) {
  return items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
}

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function LineItemsEditor({
  items,
  setItems,
  placeholder,
}: {
  items: LineItem[];
  setItems: (items: LineItem[]) => void;
  placeholder: string;
}) {
  function update(id: string, field: "label" | "amount", value: string) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function remove(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="flex gap-2">
          <input
            value={item.label}
            onChange={(e) => update(item.id, "label", e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <input
            type="number"
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => update(item.id, "amount", e.target.value)}
            placeholder="$0"
            className="w-28 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <button
            type="button"
            onClick={() => remove(item.id)}
            aria-label="Remove line"
            className="px-2 text-neutral-400 hover:text-neutral-700"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, newItem()])}
        className="self-start text-sm font-medium text-neutral-700 underline"
      >
        + Add line
      </button>
    </div>
  );
}

const DEFAULT_STARTUP = [
  { label: "Inventory / first batch", amount: "" },
  { label: "Supplies or tools", amount: "" },
];
const DEFAULT_BURN = [
  { label: "Platform / listing fees", amount: "" },
  { label: "Packaging & shipping", amount: "" },
];

export default function BudgetPage() {
  const supabase = createClient();
  const [startupCosts, setStartupCosts] = useState<LineItem[]>(
    DEFAULT_STARTUP.map((i) => newItem(i.label))
  );
  const [monthlyBurn, setMonthlyBurn] = useState<LineItem[]>(
    DEFAULT_BURN.map((i) => newItem(i.label))
  );
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: plan } = await supabase
        .from("budget_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (plan) {
        const startup = (plan.startup_costs as { label: string; amount: string }[]) ?? [];
        const burn = (plan.monthly_burn as { label: string; amount: string }[]) ?? [];
        setStartupCosts(
          startup.length
            ? startup.map((i) => ({ id: crypto.randomUUID(), ...i }))
            : DEFAULT_STARTUP.map((i) => newItem(i.label))
        );
        setMonthlyBurn(
          burn.length
            ? burn.map((i) => ({ id: crypto.randomUUID(), ...i }))
            : DEFAULT_BURN.map((i) => newItem(i.label))
        );
        setMonthlyRevenue(
          plan.monthly_revenue ? String(plan.monthly_revenue) : ""
        );
      }

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStartup = sum(startupCosts);
  const totalBurn = sum(monthlyBurn);
  const revenue = parseFloat(monthlyRevenue) || 0;
  const monthlyNet = revenue - totalBurn;
  const breakevenMonths =
    monthlyNet > 0 ? Math.ceil(totalStartup / monthlyNet) : null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase
      .from("budget_plans")
      .upsert(
        {
          user_id: user.id,
          startup_costs: startupCosts.map(({ label, amount }) => ({
            label,
            amount,
          })),
          monthly_burn: monthlyBurn.map(({ label, amount }) => ({
            label,
            amount,
          })),
          monthly_revenue: revenue,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <BackToDashboard />
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <BackToDashboard />
      <div>
        <h1 className="text-xl font-semibold">Budget calculator</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Know your numbers before you spend anything.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Startup costs
        </h2>
        <LineItemsEditor
          items={startupCosts}
          setItems={setStartupCosts}
          placeholder="What do you need to buy first?"
        />
        <p className="text-sm text-neutral-500">
          Total: <span className="font-medium text-neutral-900">{currency(totalStartup)}</span>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Monthly burn
        </h2>
        <LineItemsEditor
          items={monthlyBurn}
          setItems={setMonthlyBurn}
          placeholder="What do you spend every month?"
        />
        <p className="text-sm text-neutral-500">
          Total: <span className="font-medium text-neutral-900">{currency(totalBurn)}</span>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Expected monthly revenue
        </h2>
        <input
          type="number"
          inputMode="decimal"
          value={monthlyRevenue}
          onChange={(e) => {
            setMonthlyRevenue(e.target.value);
            setSaved(false);
          }}
          placeholder="$0"
          className="w-40 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <h2 className="text-sm font-semibold text-neutral-700">Breakeven</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Monthly profit</dt>
            <dd
              className={`font-medium ${
                monthlyNet >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {currency(monthlyNet)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Time to break even</dt>
            <dd className="font-medium text-neutral-900">
              {breakevenMonths === null
                ? "Not yet — revenue doesn't cover monthly burn"
                : `${breakevenMonths} month${breakevenMonths === 1 ? "" : "s"}`}
            </dd>
          </div>
        </dl>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save budget"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-700">
            Saved — this now shows on your dashboard.
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-400">
        Informational only — not legal, tax, or financial advice.
      </p>
    </div>
  );
}
