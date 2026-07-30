"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BackToDashboard from "@/components/BackToDashboard";

type Category =
  | "listing_fees"
  | "shipping_supplies"
  | "subscriptions"
  | "equipment"
  | "mileage_travel"
  | "marketing"
  | "other";

type Expense = {
  id: string;
  date: string;
  category: Category;
  amount: number;
  note: string | null;
};

const CATEGORY_LABEL: Record<Category, string> = {
  listing_fees: "Listing fees",
  shipping_supplies: "Shipping supplies",
  subscriptions: "Subscriptions",
  equipment: "Equipment",
  mileage_travel: "Mileage / travel",
  marketing: "Marketing",
  other: "Other",
};

const CATEGORY_ORDER: Category[] = [
  "listing_fees",
  "shipping_supplies",
  "subscriptions",
  "equipment",
  "mileage_travel",
  "marketing",
  "other",
];

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<Category>("listing_fees");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  async function loadExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be logged in.");
      return;
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      date,
      category,
      amount: parseFloat(amount) || 0,
      note: note || null,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setDate(todayISO());
    setCategory("listing_fees");
    setAmount("");
    setNote("");
    setShowForm(false);
    loadExpenses();
  }

  async function deleteExpense(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadExpenses();
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <BackToDashboard />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Expenses</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Total logged:{" "}
            <span className="font-medium text-neutral-900">
              {currency(total)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancel" : "+ Add expense"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Date
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Amount
              <input
                type="number"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 12.50"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Note (optional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Poshmark shipping labels"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save expense
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No expenses logged yet — add your first one above. This is also
          what feeds your profit report and tax write-off summary.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {CATEGORY_LABEL[exp.category]}
                  {exp.note ? (
                    <span className="font-normal text-neutral-500">
                      {" "}
                      — {exp.note}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-neutral-500">{exp.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-900">
                  {currency(exp.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteExpense(exp.id)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label="Delete expense"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
