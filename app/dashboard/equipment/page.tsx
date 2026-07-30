"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BackToDashboard from "@/components/BackToDashboard";

type EquipmentItem = {
  id: string;
  name: string;
  purchase_cost: number;
  purchase_date: string | null;
  note: string | null;
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function EquipmentPage() {
  const supabase = createClient();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [note, setNote] = useState("");

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment_items")
      .select("*")
      .order("purchase_date", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems(data as EquipmentItem[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
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

    const { error } = await supabase.from("equipment_items").insert({
      user_id: user.id,
      name,
      purchase_cost: parseFloat(purchaseCost) || 0,
      purchase_date: purchaseDate || null,
      note: note || null,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    setPurchaseCost("");
    setPurchaseDate(todayISO());
    setNote("");
    setShowForm(false);
    loadItems();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this equipment item?")) return;
    const { error } = await supabase.from("equipment_items").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadItems();
  }

  const totalValue = items.reduce((sum, i) => sum + i.purchase_cost, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <BackToDashboard />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Equipment</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Total invested:{" "}
            <span className="font-medium text-neutral-900">
              {currency(totalValue)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancel" : "+ Add equipment"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              Equipment name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pressure washer"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Purchase cost
              <input
                type="number"
                inputMode="decimal"
                required
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                placeholder="e.g. 450"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Purchase date
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              Note (optional)
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bought used, serial number, condition"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save equipment
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No equipment logged yet — add what you use to deliver your
          service. Purchase costs here are usually deductible too, worth
          keeping a record for tax time.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {item.name}
                  {item.note ? (
                    <span className="font-normal text-neutral-500">
                      {" "}
                      — {item.note}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.purchase_date ?? "No date logged"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-900">
                  {currency(item.purchase_cost)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label="Delete equipment item"
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
