"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import BackToDashboard from "@/components/BackToDashboard";

type SoldItem = {
  sale_price: number | null;
  cogs: number;
  date_sold: string | null;
};

type PaidInvoiceLine = {
  price: number;
  quantity: number;
  date_paid: string;
};

type Expense = {
  date: string;
  category: string;
  amount: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  listing_fees: "Listing fees",
  shipping_supplies: "Shipping supplies",
  subscriptions: "Subscriptions",
  equipment: "Equipment",
  mileage_travel: "Mileage / travel",
  marketing: "Marketing",
  other: "Other",
};

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function monthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const label = start.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return { start, end, label };
}

function inRange(dateStr: string | null, start: Date, end: Date) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d >= start && d < end;
}

function weekBuckets() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const buckets = [];
  for (let i = 3; i >= 0; i--) {
    const bucketEnd = new Date(end.getTime() - i * 7 * 86400000);
    const bucketStart = new Date(bucketEnd.getTime() - 7 * 86400000);
    buckets.push({ start: bucketStart, end: bucketEnd, label: `Wk ${4 - i}` });
  }
  return buckets;
}

export default function ReportsPage() {
  const supabase = createClient();
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [paidLines, setPaidLines] = useState<PaidInvoiceLine[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [itemsRes, invoicesRes, expensesRes] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("sale_price, cogs, date_sold")
          .eq("status", "sold"),
        supabase
          .from("invoices")
          .select("id, date_paid, invoice_items(price, quantity, item_id)")
          .eq("status", "paid"),
        supabase.from("expenses").select("date, category, amount"),
      ]);

      if (itemsRes.error || invoicesRes.error || expensesRes.error) {
        setError(
          itemsRes.error?.message ||
            invoicesRes.error?.message ||
            expensesRes.error?.message ||
            "Failed to load report data."
        );
        setLoading(false);
        return;
      }

      setSoldItems(itemsRes.data as SoldItem[]);
      setExpenses(expensesRes.data as Expense[]);

      // Only count free-form invoice lines (no linked inventory item) as
      // revenue here — item-linked lines are already counted via
      // inventory_items.sale_price, and double-counting would inflate
      // revenue for anything billed and sold through both flows.
      type InvoiceRow = {
        date_paid: string | null;
        invoice_items: { price: number; quantity: number; item_id: string | null }[];
      };
      const lines: PaidInvoiceLine[] = [];
      for (const invoice of invoicesRes.data as InvoiceRow[]) {
        if (!invoice.date_paid) continue;
        for (const line of invoice.invoice_items) {
          if (line.item_id) continue;
          lines.push({
            price: line.price,
            quantity: line.quantity,
            date_paid: invoice.date_paid,
          });
        }
      }
      setPaidLines(lines);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { start, end, label } = monthRange(monthOffset);

  const pl = useMemo(() => {
    const monthSold = soldItems.filter((i) => inRange(i.date_sold, start, end));
    const monthLines = paidLines.filter((l) => inRange(l.date_paid, start, end));
    const monthExpenses = expenses.filter((e) => inRange(e.date, start, end));

    const itemRevenue = monthSold.reduce((s, i) => s + (i.sale_price ?? 0), 0);
    const lineRevenue = monthLines.reduce((s, l) => s + l.price * l.quantity, 0);
    const revenue = itemRevenue + lineRevenue;
    const cogs = monthSold.reduce((s, i) => s + i.cogs, 0);
    const grossProfit = revenue - cogs;
    const expensesTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - expensesTotal;

    const byCategory: Record<string, number> = {};
    for (const e of monthExpenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }

    return { revenue, cogs, grossProfit, expensesTotal, netProfit, byCategory };
  }, [soldItems, paidLines, expenses, start, end]);

  const cashFlow = useMemo(() => {
    const buckets = weekBuckets();
    const weeks = buckets.map((b) => {
      const inSold = soldItems
        .filter((i) => inRange(i.date_sold, b.start, b.end))
        .reduce((s, i) => s + (i.sale_price ?? 0), 0);
      const inLines = paidLines
        .filter((l) => inRange(l.date_paid, b.start, b.end))
        .reduce((s, l) => s + l.price * l.quantity, 0);
      const out = expenses
        .filter((e) => inRange(e.date, b.start, b.end))
        .reduce((s, e) => s + e.amount, 0);
      return { label: b.label, in: inSold + inLines, out };
    });
    const max = Math.max(1, ...weeks.map((w) => Math.max(w.in, w.out)));
    return { weeks, max };
  }, [soldItems, paidLines, expenses]);

  const writeOffs = useMemo(() => {
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const ytdSold = soldItems.filter((i) => inRange(i.date_sold, yearStart, yearEnd));
    const ytdExpenses = expenses.filter((e) => inRange(e.date, yearStart, yearEnd));
    const cogs = ytdSold.reduce((s, i) => s + i.cogs, 0);
    const byCategory: Record<string, number> = {};
    for (const e of ytdExpenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    const expensesTotal = ytdExpenses.reduce((s, e) => s + e.amount, 0);
    return { year, cogs, byCategory, expensesTotal, total: cogs + expensesTotal };
  }, [soldItems, expenses]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 print:max-w-full">
      <BackToDashboard />

      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold">Reports</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Print report
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <>
          <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-700">
                Profit and loss
              </h2>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => setMonthOffset((m) => m - 1)}
                  aria-label="Previous month"
                  className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
                >
                  ←
                </button>
                <span className="text-sm text-neutral-500">{label}</span>
                <button
                  type="button"
                  onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
                  aria-label="Next month"
                  disabled={monthOffset === 0}
                  className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                >
                  →
                </button>
              </div>
              <span className="hidden text-sm text-neutral-500 print:inline">
                {label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-neutral-500">Revenue</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900">
                  {currency(pl.revenue)}
                </p>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-neutral-500">Expenses</p>
                <p className="mt-1 text-lg font-semibold text-neutral-900">
                  {currency(pl.expensesTotal)}
                </p>
              </div>
              <div className="rounded-md bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Net profit</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {currency(pl.netProfit)}
                </p>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-300 pt-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">
                  Sold items and paid invoices
                </span>
                <span className="text-neutral-900">{currency(pl.revenue)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Cost of goods sold</span>
                <span className="text-neutral-900">-{currency(pl.cogs)}</span>
              </div>
              <div className="flex justify-between py-1 font-medium">
                <span className="text-neutral-900">Gross profit</span>
                <span className="text-neutral-900">
                  {currency(pl.grossProfit)}
                </span>
              </div>
              {Object.entries(pl.byCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1 pl-3">
                  <span className="text-neutral-500">
                    {CATEGORY_LABEL[cat] ?? cat}
                  </span>
                  <span className="text-neutral-900">-{currency(amt)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5 print:hidden print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-700">
                Cash flow
              </h2>
              <span className="text-sm text-neutral-500">Last 4 weeks</span>
            </div>
            <div className="flex h-32 items-end gap-3 px-1">
              {cashFlow.weeks.map((w) => (
                <div
                  key={w.label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div className="flex h-full items-end gap-1">
                    <div
                      className="w-3 rounded-t bg-emerald-500"
                      style={{ height: `${(w.in / cashFlow.max) * 100}%` }}
                    />
                    <div
                      className="w-3 rounded-t bg-neutral-400"
                      style={{ height: `${(w.out / cashFlow.max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-neutral-400">
                    {w.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 border-t border-neutral-200 pt-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Money in
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-neutral-400" />
                Money out
              </span>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-5 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-700">
                Tax write-offs — {writeOffs.year} year to date
              </h2>
              <span className="text-sm font-semibold text-neutral-900">
                {currency(writeOffs.total)}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Business costs are generally deductible. This is what you&apos;ve
              logged, not tax advice — confirm specifics with a tax
              professional before filing.
            </p>
            <div className="border-t border-dashed border-neutral-300 pt-3 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">
                  Cost of goods sold (sold items)
                </span>
                <span className="text-neutral-900">{currency(writeOffs.cogs)}</span>
              </div>
              {Object.entries(writeOffs.byCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between py-1">
                  <span className="text-neutral-500">
                    {CATEGORY_LABEL[cat] ?? cat}
                  </span>
                  <span className="text-neutral-900">{currency(amt)}</span>
                </div>
              ))}
              {writeOffs.total === 0 && (
                <p className="py-1 text-neutral-500">
                  Nothing logged yet this year.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      <p className="text-xs text-neutral-400 print:hidden">
        Informational only — not tax, legal, or financial advice.
      </p>
    </div>
  );
}
