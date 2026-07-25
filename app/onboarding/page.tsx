"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    business_name: "",
    address: "",
    phone: "",
    website: "",
    social_links: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in.");
      setLoading(false);
      return;
    }

    let logo_url: string | null = null;

    if (logoFile) {
      const path = `${user.id}/${Date.now()}-${logoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, logoFile);

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      logo_url = supabase.storage.from("logos").getPublicUrl(path)
        .data.publicUrl;
    }

    const { error: upsertError } = await supabase
      .from("business_profile")
      .upsert(
        {
          user_id: user.id,
          business_name: form.business_name,
          address: form.address,
          phone: form.phone,
          website: form.website,
          social_links: form.social_links,
          logo_url,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Set up your business</h1>
        <p className="mt-1 text-sm text-neutral-500">
          This appears automatically on every invoice you send.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Business name
          <input
            required
            value={form.business_name}
            onChange={(e) => update("business_name", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Website
          <input
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Social links
          <input
            placeholder="@yourbusiness"
            value={form.social_links}
            onChange={(e) => update("social_links", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </main>
  );
}
