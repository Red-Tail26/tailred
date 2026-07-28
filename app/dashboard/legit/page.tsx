"use client";

import { useEffect, useRef, useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";
import { createClient } from "@/lib/supabase/client";
import { LEGIT_CHECKLIST } from "@/lib/legitChecklist";

export default function LegitChecklistPage() {
  const supabase = createClient();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  // Mirrors `completed` synchronously so rapid clicks each build on the
  // latest set instead of a stale value captured in a render's closure.
  const completedRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("business_checklist")
        .select("completed_items")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        const loaded = new Set((data.completed_items as string[]) ?? []);
        completedRef.current = loaded;
        setCompleted(loaded);
      }

      setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(key: string) {
    setError(null);

    const previous = completedRef.current;
    const next = new Set(previous);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    completedRef.current = next;
    setCompleted(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      completedRef.current = previous;
      setCompleted(previous);
      setError("You need to be logged in.");
      return;
    }

    const { error: upsertError } = await supabase
      .from("business_checklist")
      .upsert(
        {
          user_id: user.id,
          completed_items: Array.from(next),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      completedRef.current = previous;
      setCompleted(previous);
      setError(upsertError.message);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        <BackToDashboard />
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <BackToDashboard />
      <div>
        <h1 className="text-xl font-semibold">Getting legit</h1>
        <p className="mt-1 text-sm text-neutral-500">
          The paperwork side of starting a business — check these off at
          your own pace. {completed.size} of {LEGIT_CHECKLIST.length} done.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {LEGIT_CHECKLIST.map((item) => {
          const done = completed.has(item.key);
          return (
            <li
              key={item.key}
              className="flex gap-3 rounded-lg border border-neutral-200 p-4"
            >
              <button
                type="button"
                onClick={() => toggle(item.key)}
                aria-label={done ? "Mark not done" : "Mark done"}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                  done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-neutral-300 text-transparent"
                }`}
              >
                ✓
              </button>
              <div>
                <p
                  className={`text-sm font-medium ${
                    done ? "text-neutral-400 line-through" : "text-neutral-900"
                  }`}
                >
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {item.description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {item.link && (
                    <a
                      href={item.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-medium text-neutral-700 underline"
                    >
                      {item.link.label} ↗
                    </a>
                  )}
                  {item.partner && (
                    <a
                      href={item.partner.href}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-block text-xs font-medium text-amber-700 underline"
                    >
                      {item.partner.label} ↗
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-neutral-400">
        Informational only — not legal, tax, or financial advice. Every
        state and city is different; when in doubt, check with a local
        professional.
        <br />
        Links in amber are partner recommendations — Tailred may earn a
        commission if you sign up through one, at no extra cost to you.
        We only recommend services we think are genuinely worth
        considering.
      </p>
    </div>
  );
}
