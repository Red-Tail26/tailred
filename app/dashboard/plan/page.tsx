"use client";

import { useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

type Intake = {
  problem: string;
  whoHasProblem: string;
  whyChooseYou: string;
  opportunitySize: string;
  revenueModel: string;
  costs: string;
  customerAcquisition: string;
  differentiation: string;
  profitabilityTimeline: string;
  risks: string;
};

type Plan = Intake;

const QUESTIONS: { key: keyof Intake; label: string; placeholder: string }[] = [
  {
    key: "problem",
    label: "What problem am I solving?",
    placeholder: "e.g. Finding quality secondhand pieces without digging through thrift stores",
  },
  {
    key: "whoHasProblem",
    label: "Who has this problem?",
    placeholder: "e.g. People who shop secondhand fashion online",
  },
  {
    key: "whyChooseYou",
    label: "Why will they choose my solution?",
    placeholder: "e.g. I hand-pick and photograph every item, no digging required",
  },
  {
    key: "opportunitySize",
    label: "How big is the opportunity?",
    placeholder: "e.g. My local resale groups have a few thousand active buyers",
  },
  {
    key: "revenueModel",
    label: "How will I make money?",
    placeholder: "e.g. Marked up 2-3x cost, priced to market",
  },
  {
    key: "costs",
    label: "What will it cost to operate?",
    placeholder: "e.g. Sourcing cost, listing fees, shipping supplies",
  },
  {
    key: "customerAcquisition",
    label: "How will I find customers?",
    placeholder: "e.g. Posting in local resale groups and on Poshmark",
  },
  {
    key: "differentiation",
    label: "What makes me difficult to replace?",
    placeholder: "e.g. My sourcing relationships and eye for quality pieces",
  },
  {
    key: "profitabilityTimeline",
    label: "When will I become profitable?",
    placeholder: "e.g. After covering the first $200 in sourcing costs",
  },
  {
    key: "risks",
    label: "What assumptions could prove me wrong?",
    placeholder: "e.g. That buyers will pay a markup for pre-selected pieces",
  },
];

const EMPTY_INTAKE: Intake = {
  problem: "",
  whoHasProblem: "",
  whyChooseYou: "",
  opportunitySize: "",
  revenueModel: "",
  costs: "",
  customerAcquisition: "",
  differentiation: "",
  profitabilityTimeline: "",
  risks: "",
};

function fallbackPlan(intake: Intake): Plan {
  const tighten = (value: string) =>
    value.trim() || "Not yet answered — worth thinking through before relying on this plan.";

  return {
    problem: tighten(intake.problem),
    whoHasProblem: tighten(intake.whoHasProblem),
    whyChooseYou: tighten(intake.whyChooseYou),
    opportunitySize: tighten(intake.opportunitySize),
    revenueModel: tighten(intake.revenueModel),
    costs: tighten(intake.costs),
    customerAcquisition: tighten(intake.customerAcquisition),
    differentiation: tighten(intake.differentiation),
    profitabilityTimeline: tighten(intake.profitabilityTimeline),
    risks: tighten(intake.risks),
  };
}

export default function PlanPage() {
  const [intake, setIntake] = useState<Intake>(EMPTY_INTAKE);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  function update<K extends keyof Intake>(key: K, value: string) {
    setIntake((f) => ({ ...f, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUsedFallback(false);

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      if (!res.ok) throw new Error("Plan generation failed");
      setPlan(await res.json());
    } catch {
      setPlan(fallbackPlan(intake));
      setUsedFallback(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <BackToDashboard />
      <div>
        <h1 className="text-xl font-semibold">Business plan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Answer these ten questions honestly — the plan below is built
          strictly from your own answers, not generic advice.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        {QUESTIONS.map((q, i) => (
          <label key={q.key} className="flex flex-col gap-1 text-sm">
            {i + 1}. {q.label}
            <textarea
              required={i === 0}
              value={intake[q.key]}
              onChange={(e) => update(q.key, e.target.value)}
              placeholder={q.placeholder}
              rows={2}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate plan"}
        </button>
      </form>

      {usedFallback && (
        <p className="text-xs text-amber-600">
          AI plan generation wasn&apos;t available, so this is your own
          answers organized as-is.
        </p>
      )}

      {plan && (
        <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <h2 className="text-sm font-semibold text-neutral-700">
                {q.label}
              </h2>
              <p className="mt-1 text-sm text-neutral-900">{plan[q.key]}</p>
            </div>
          ))}
        </section>
      )}

      <p className="text-xs text-neutral-400">
        Informational only — not legal, tax, or financial advice.
      </p>
    </div>
  );
}
