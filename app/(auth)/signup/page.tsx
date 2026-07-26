"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is required before a session exists.
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  if (confirmationSent) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-neutral-500">
          We sent a confirmation link to <strong>{email}</strong>. Click it,
          then come back and log in.
        </p>
        <a
          href="/login"
          className="mt-2 font-medium text-neutral-900 underline"
        >
          Go to log in
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Start with your email — you&apos;ll set up your business next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-neutral-900 underline">
          Log in
        </a>
      </p>
    </main>
  );
}
