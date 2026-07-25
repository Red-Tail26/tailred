import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Tailred</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
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
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
