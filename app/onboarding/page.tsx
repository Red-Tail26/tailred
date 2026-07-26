"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BackToDashboard from "@/components/BackToDashboard";

const BUSINESS_TYPES = [
  "Reselling",
  "Repair",
  "Moving",
  "Cleaning",
  "Tutoring",
  "Delivery",
  "Food cart / pop-up",
  "Home / social food sales",
  "Product brand",
  "Other",
];

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    business_name: "",
    business_type: "",
    address: "",
    phone: "",
    website: "",
    social_links: "",
  });
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadExistingProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data: profile } = await supabase
        .from("business_profile")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        setForm({
          business_name: profile.business_name ?? "",
          business_type: profile.business_type ?? "",
          address: profile.address ?? "",
          phone: profile.phone ?? "",
          website: profile.website ?? "",
          social_links: profile.social_links ?? "",
        });
        setExistingLogoUrl(profile.logo_url ?? null);
        setHasExistingProfile(true);
      }

      setLoadingProfile(false);
    }

    loadExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleLogoChange(file: File | null) {
    setLogoError(null);

    if (file && file.size > MAX_LOGO_BYTES) {
      setLogoError("That image is too large — please pick one under 5MB.");
      setLogoFile(null);
      return;
    }

    setLogoFile(file);
  }

  async function handleSkip() {
    router.push("/dashboard");
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

    let logo_url = existingLogoUrl;

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
          business_name: form.business_name || null,
          business_type: form.business_type || null,
          address: form.address || null,
          phone: form.phone || null,
          website: form.website || null,
          social_links: form.social_links || null,
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

  if (loadingProfile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <BackToDashboard />
      <div>
        <h1 className="text-2xl font-semibold">
          {hasExistingProfile ? "Edit your business" : "Set up your business"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          This appears automatically on every invoice you send. Pick what
          kind of business this is to save — everything else below is
          optional, fill it in whenever you&apos;re ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          What kind of business is this?
          <select
            aria-required="true"
            required
            value={form.business_type}
            onChange={(e) => update("business_type", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          >
            <option value="" disabled>
              Select…
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Business name <span className="text-neutral-400">(optional)</span>
          <input
            value={form.business_name}
            onChange={(e) => update("business_name", e.target.value)}
            placeholder="e.g. Jordan's Resale Corner"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Logo <span className="text-neutral-400">(optional)</span>
          {existingLogoUrl && !logoFile ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={existingLogoUrl}
              alt="Current logo"
              className="mb-1 h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded bg-neutral-100 text-lg font-semibold text-neutral-400">
              {form.business_name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <span className="text-xs text-neutral-400">
            No logo yet? No problem — we&apos;ll show your initial until you
            add one. Max 5MB.
          </span>
          {logoError && <p className="text-sm text-red-600">{logoError}</p>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Address <span className="text-neutral-400">(optional)</span>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Phone <span className="text-neutral-400">(optional)</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Website <span className="text-neutral-400">(optional)</span>
          <input
            type="text"
            placeholder="yourbusiness.com"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Social links <span className="text-neutral-400">(optional)</span>
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

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-medium text-neutral-500 underline"
        >
          Skip for now
        </button>
      </form>
    </main>
  );
}
