import Link from "next/link";

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900"
    >
      ← Back to Dashboard
    </Link>
  );
}
