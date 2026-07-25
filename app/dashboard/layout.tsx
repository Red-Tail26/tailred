import Link from "next/link";

const navItems = [
  { href: "/dashboard/inventory", label: "Inventory" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/plan", label: "Business Plan" },
  { href: "/dashboard/budget", label: "Budget Calculator" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-16 md:pb-0 md:pl-56">
      <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-neutral-200 bg-white py-2 md:inset-y-0 md:left-0 md:right-auto md:w-56 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:p-4">
        <div className="hidden px-2 pb-4 text-lg font-semibold md:block">
          Tailred
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-center text-xs text-neutral-600 hover:bg-neutral-100 md:text-left md:text-sm"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
