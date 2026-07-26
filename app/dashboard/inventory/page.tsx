"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BackToDashboard from "@/components/BackToDashboard";

type Status = "sourced" | "listed" | "sold";

type InventoryItem = {
  id: string;
  item_name: string;
  cogs: number;
  list_price: number | null;
  platform: string | null;
  status: Status;
  sale_price: number | null;
  date_sold: string | null;
};

function currency(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function profit(item: InventoryItem) {
  if (item.status !== "sold" || item.sale_price === null) return null;
  return item.sale_price - item.cogs;
}

const STATUS_LABEL: Record<Status, string> = {
  sourced: "Sourced",
  listed: "Listed",
  sold: "Sold",
};

const STATUS_ORDER: Status[] = ["sourced", "listed", "sold"];

const PLATFORM_OPTIONS = [
  "Poshmark",
  "Mercari",
  "eBay",
  "Depop",
  "Facebook Marketplace",
  "In-person",
  "Other",
];

export default function InventoryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    cogs: "",
    list_price: "",
    platform: "",
    platformOther: "",
  });

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems(data as InventoryItem[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be logged in.");
      return;
    }

    const resolvedPlatform =
      newItem.platform === "Other"
        ? newItem.platformOther || null
        : newItem.platform || null;

    const { error } = await supabase.from("inventory_items").insert({
      user_id: user.id,
      item_name: newItem.item_name,
      cogs: parseFloat(newItem.cogs) || 0,
      list_price: newItem.list_price ? parseFloat(newItem.list_price) : null,
      platform: resolvedPlatform,
      status: "sourced",
    });

    if (error) {
      setError(error.message);
      return;
    }

    setNewItem({
      item_name: "",
      cogs: "",
      list_price: "",
      platform: "",
      platformOther: "",
    });
    setShowForm(false);
    loadItems();
  }

  async function updateStatus(item: InventoryItem, status: Status) {
    const updates: Partial<InventoryItem> = { status };

    if (status === "sold") {
      const salePriceInput = window.prompt(
        `Sale price for "${item.item_name}"?`,
        item.list_price?.toString() ?? ""
      );
      if (salePriceInput === null) return;
      updates.sale_price = parseFloat(salePriceInput) || 0;
      updates.date_sold = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", item.id);

    if (error) {
      setError(error.message);
      return;
    }

    loadItems();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Delete this item?")) return;
    const { error } = await supabase.from("inventory_items").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    loadItems();
  }

  const totalProfit = items.reduce((sum, item) => sum + (profit(item) ?? 0), 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <BackToDashboard />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Total profit:{" "}
            <span className="font-medium text-neutral-900">
              {currency(totalProfit)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancel" : "+ Add item"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddItem}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Item name
              <input
                required
                value={newItem.item_name}
                onChange={(e) =>
                  setNewItem((f) => ({ ...f, item_name: e.target.value }))
                }
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Platform
              <select
                value={newItem.platform}
                onChange={(e) =>
                  setNewItem((f) => ({ ...f, platform: e.target.value }))
                }
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Select…</option>
                {PLATFORM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {newItem.platform === "Other" && (
                <input
                  placeholder="Platform name"
                  value={newItem.platformOther}
                  onChange={(e) =>
                    setNewItem((f) => ({ ...f, platformOther: e.target.value }))
                  }
                  className="mt-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              )}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Cost of goods
              <input
                type="number"
                inputMode="decimal"
                required
                value={newItem.cogs}
                onChange={(e) =>
                  setNewItem((f) => ({ ...f, cogs: e.target.value }))
                }
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              List price
              <input
                type="number"
                inputMode="decimal"
                value={newItem.list_price}
                onChange={(e) =>
                  setNewItem((f) => ({ ...f, list_price: e.target.value }))
                }
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>
          <button
            type="submit"
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save item
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No items yet — add your first one above.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500">
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 pr-3 font-medium">Platform</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">COGS</th>
                <th className="py-2 pr-3 font-medium">Sale price</th>
                <th className="py-2 pr-3 font-medium">Profit</th>
                <th className="py-2 pr-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemProfit = profit(item);
                return (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-3 text-neutral-900">
                      {item.item_name}
                    </td>
                    <td className="py-2 pr-3 text-neutral-500">
                      {item.platform ?? "—"}
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          updateStatus(item, e.target.value as Status)
                        }
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3 text-neutral-900">
                      {currency(item.cogs)}
                    </td>
                    <td className="py-2 pr-3 text-neutral-900">
                      {currency(item.sale_price)}
                    </td>
                    <td
                      className={`py-2 pr-3 font-medium ${
                        itemProfit === null
                          ? "text-neutral-400"
                          : itemProfit >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                      }`}
                    >
                      {itemProfit === null ? "—" : currency(itemProfit)}
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="text-neutral-400 hover:text-red-600"
                        aria-label="Delete item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
