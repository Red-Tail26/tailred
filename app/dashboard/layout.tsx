"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Grouped deliberately, not just alphabetized: "the work" is the actual
// craft/hustle (sourcing, listing, selling — the technician's job).
// "The business" is everything that makes it a real business instead of
// a hobby (profile, paperwork, money, getting paid — the owner's job).
// Same distinction E-Myth is about; the nav itself teaches it.
const navGroups = [
  {
    label: "Do the work",
    items: [{ href: "/dashboard/inventory", label: "Inventory" }],
  },
  {
    label: "Run the business",
    items: [
      { href: "/onboarding", label: "Business Profile" },
      { href: "/dashboard/legit", label: "Getting Legit" },
      { href: "/dashboard/budget", label: "Budget Calculator" },
      { href: "/dashboard/plan", label: "Business Plan" },
      { href: "/dashboard/invoices", label: "Invoices" },
      { href: "/dashboard/payments", label: "Get Paid" },
      { href: "/dashboard/expenses", label: "Expenses" },
      { href: "/dashboard/reports", label: "Reports" },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh pb-16 md:pb-0 md:pl-56 print:pb-0 print:pl-0">
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-neutral-200 bg-white py-2 print:hidden md:inset-y-0 md:left-0 md:right-auto md:w-56 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:p-4">
        <Link
          href="/dashboard"
          className="hidden items-center gap-2 px-2 pb-4 md:flex"
        >
          <Image
            src="/icons/icon-192.png"
            alt="Tailred"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="text-lg font-semibold text-neutral-900">
            Tailred
          </span>
        </Link>

        {/* Mobile: flat row, no group labels — a bottom bar has no room
            for them. 7 items don't fit one screen width, so this scrolls
            horizontally instead of wrapping or getting clipped.
            Desktop: grouped with headers. */}
        <div className="flex w-full gap-1 overflow-x-auto px-2 md:hidden">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-center text-xs text-neutral-600 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden w-full flex-col gap-4 md:flex">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-wide text-neutral-400">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md px-3 py-2 text-center text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 md:mt-auto md:text-left md:text-sm"
        >
          Log out
        </button>
      </nav>
      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
