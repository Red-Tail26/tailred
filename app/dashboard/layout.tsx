"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/onboarding", label: "Business Profile" },
  { href: "/dashboard/legit", label: "Getting Legit" },
  { href: "/dashboard/budget", label: "Budget Calculator" },
  { href: "/dashboard/plan", label: "Business Plan" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/inventory", label: "Inventory" },
];

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
    <div className="min-h-dvh pb-16 md:pb-0 md:pl-56">
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-neutral-200 bg-white py-2 md:inset-y-0 md:left-0 md:right-auto md:w-56 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:p-4">
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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-center text-xs text-neutral-600 hover:bg-neutral-100 md:text-left md:text-sm"
          >
            {item.label}
          </Link>
        ))}
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
