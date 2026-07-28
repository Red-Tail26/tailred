import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tailred — Turn a side hustle into a running business",
  description:
    "Free tools to start and run a side hustle: a business plan, a budget calculator, inventory and profit tracking, invoicing, and getting paid — all in one place. Built for resellers, personal trainers, and service businesses just starting out.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/icons/icon-512.png"
          alt="Tailred"
          width={64}
          height={64}
          className="rounded-xl"
          priority
        />
        <h1 className="text-3xl font-semibold text-neutral-900">Tailred</h1>
        <p className="mx-auto max-w-sm text-sm text-neutral-500">
          Turn a side hustle into a running business — plan it, price it,
          track it, get paid.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
