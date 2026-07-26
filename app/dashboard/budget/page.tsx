"use client";

import { useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

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

export default function BudgetPage() {
  const [startupCosts, setStartupCosts] = useState<LineItem[]>([
    newItem("Inventory / first batch"),
    newItem("Supplies or tools"),
  ]);
  const [monthlyBurn, setMonthlyBurn] = useState<LineItem[]>([
    newItem("Platform / listing fees"),
    newItem("Packaging & shipping"),
  ]);
  const [monthlyRevenue, setMonthlyRevenue] = useState("");

  const totalStartup = sum(startupCosts);
  const totalBurn = sum(monthlyBurn);
  const revenue = parseFloat(monthlyRevenue) || 0;
  const monthlyNet = revenue - totalBurn;
  const breakevenMonths =
    monthlyNet > 0 ? Math.ceil(totalStartup / monthlyNet) : null;

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
          onChange={(e) => setMonthlyRevenue(e.target.value)}
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

      <p className="text-xs text-neutral-400">
        Informational only — not legal, tax, or financial advice.
      </p>
    </div>
  );
}
