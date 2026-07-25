"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Invoice = {
  id: string;
  client_name: string;
  client_contact: string | null;
  status: "draft" | "sent" | "paid";
  date_sent: string | null;
  date_paid: string | null;
};

type SoldItem = {
  id: string;
  item_name: string;
  sale_price: number | null;
};

type DraftLine = { description: string; price: string; quantity: string; item_id?: string };

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const STATUS_STYLE: Record<Invoice["status"], string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export default function InvoicesPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { description: "", price: "", quantity: "1" },
  ]);

  async function loadAll() {
    setLoading(true);
    const [invoicesRes, itemsRes] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      supabase
        .from("inventory_items")
        .select("id, item_name, sale_price")
        .eq("status", "sold"),
    ]);

    if (invoicesRes.error) {
      setError(invoicesRes.error.message);
    } else {
      setInvoices(invoicesRes.data as Invoice[]);
    }
    if (!itemsRes.error) {
      setSoldItems(itemsRes.data as SoldItem[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSoldItemLine(item: SoldItem) {
    setLines((ls) => [
      ...ls,
      {
        description: item.item_name,
        price: (item.sale_price ?? 0).toString(),
        quantity: "1",
        item_id: item.id,
      },
    ]);
  }

  function addBlankLine() {
    setLines((ls) => [...ls, { description: "", price: "", quantity: "1" }]);
  }

  function updateLine(index: number, field: keyof DraftLine, value: string) {
    setLines((ls) =>
      ls.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  function removeLine(index: number) {
    setLines((ls) => ls.filter((_, i) => i !== index));
  }

  const total = lines.reduce(
    (sum, l) => sum + (parseFloat(l.price) || 0) * (parseFloat(l.quantity) || 0),
    0
  );

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be logged in.");
      return;
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_name: clientName,
        client_contact: clientContact || null,
        status: "draft",
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      setError(invoiceError?.message ?? "Could not create invoice.");
      return;
    }

    const lineRows = lines
      .filter((l) => l.description && l.price)
      .map((l) => ({
        invoice_id: invoice.id,
        item_id: l.item_id ?? null,
        description: l.description,
        price: parseFloat(l.price) || 0,
        quantity: parseInt(l.quantity, 10) || 1,
      }));

    if (lineRows.length > 0) {
      const { error: lineError } = await supabase
        .from("invoice_items")
        .insert(lineRows);
      if (lineError) {
        setError(lineError.message);
        return;
      }
    }

    setClientName("");
    setClientContact("");
    setLines([{ description: "", price: "", quantity: "1" }]);
    setShowForm(false);
    loadAll();
  }

  async function markSent(invoiceId: string) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "sent", date_sent: new Date().toISOString().slice(0, 10) })
      .eq("id", invoiceId);
    if (error) setError(error.message);
    else loadAll();
  }

  async function markPaid(invoiceId: string) {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", date_paid: new Date().toISOString().slice(0, 10) })
      .eq("id", invoiceId);
    if (error) setError(error.message);
    else loadAll();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancel" : "+ New invoice"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateInvoice}
          className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Client name
              <input
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Client contact
              <input
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="email or phone"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>

          {soldItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-neutral-700">
                Add a sold item
              </span>
              <div className="flex flex-wrap gap-2">
                {soldItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => addSoldItemLine(item)}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700"
                  >
                    {item.item_name} — {currency(item.sale_price ?? 0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-700">
              Line items
            </span>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                  placeholder="Description"
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={line.price}
                  onChange={(e) => updateLine(i, "price", e.target.value)}
                  placeholder="Price"
                  className="w-24 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  placeholder="Qty"
                  className="w-16 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="px-2 text-neutral-400 hover:text-red-600"
                  aria-label="Remove line"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBlankLine}
              className="self-start text-sm font-medium text-neutral-700 underline"
            >
              + Add free-form line
            </button>
          </div>

          <p className="text-sm text-neutral-700">
            Total: <span className="font-semibold">{currency(total)}</span>
          </p>

          <button
            type="submit"
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Save invoice
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No invoices yet — create your first one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-3"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {invoice.client_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {invoice.client_contact ?? "No contact on file"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[invoice.status]}`}
                >
                  {invoice.status}
                </span>
                <Link
                  href={`/invoice/${invoice.id}`}
                  target="_blank"
                  className="text-xs font-medium text-neutral-700 underline"
                >
                  View link
                </Link>
                {invoice.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => markSent(invoice.id)}
                    className="text-xs font-medium text-neutral-700 underline"
                  >
                    Mark sent
                  </button>
                )}
                {invoice.status === "sent" && (
                  <button
                    type="button"
                    onClick={() => markPaid(invoice.id)}
                    className="text-xs font-medium text-neutral-700 underline"
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
