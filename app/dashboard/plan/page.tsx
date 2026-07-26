"use client";

import { useState } from "react";
import BackToDashboard from "@/components/BackToDashboard";

type Intake = {
  idea: string;
  customer: string;
  problem: string;
  pricing: string;
  startupBudget: string;
};

function generatePlan(intake: Intake) {
  const businessLabel = intake.idea || "your business";

  return {
    summary: `${businessLabel} exists to help ${intake.customer || "your customers"} with ${
      intake.problem || "a problem worth solving"
    }. It's a straightforward business built to start small and prove itself before you spend more.`,
    customer: intake.customer || "Not specified yet — who is this for?",
    problem: intake.problem || "Not specified yet — what does this solve?",
    pricing: intake.pricing || "Not specified yet — what will you charge?",
    firstSteps: [
      `Source your first item or first client for ${businessLabel}.`,
      "List it or offer it, and track the real cost against what it sells for.",
      "Send your first invoice and get paid before spending more.",
      `Revisit the budget calculator once you have one real sale — that number is worth more than any estimate.`,
    ],
    budget: intake.startupBudget
      ? `You're starting with about ${intake.startupBudget}. Use the budget calculator to see how many sales it takes to break even.`
      : "No starting budget entered yet — the budget calculator can help you figure out what you actually need.",
  };
}

export default function PlanPage() {
  const [intake, setIntake] = useState<Intake>({
    idea: "",
    customer: "",
    problem: "",
    pricing: "",
    startupBudget: "",
  });
  const [plan, setPlan] = useState<ReturnType<typeof generatePlan> | null>(null);

  function update<K extends keyof Intake>(key: K, value: string) {
    setIntake((f) => ({ ...f, [key]: value }));
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setPlan(generatePlan(intake));
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <BackToDashboard />
      <div>
        <h1 className="text-xl font-semibold">Business plan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Answer a few questions, get a one-page plan to work from.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          What&apos;s the idea?
          <input
            required
            value={intake.idea}
            onChange={(e) => update("idea", e.target.value)}
            placeholder="e.g. Reselling vintage denim"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Who&apos;s it for?
          <input
            value={intake.customer}
            onChange={(e) => update("customer", e.target.value)}
            placeholder="e.g. People who shop secondhand fashion online"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          What problem does it solve for them?
          <input
            value={intake.problem}
            onChange={(e) => update("problem", e.target.value)}
            placeholder="e.g. Finding quality pieces without thrift-store digging"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          How will you price it?
          <input
            value={intake.pricing}
            onChange={(e) => update("pricing", e.target.value)}
            placeholder="e.g. Marked up 2-3x cost, priced to market"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          What do you have to start with?
          <input
            value={intake.startupBudget}
            onChange={(e) => update("startupBudget", e.target.value)}
            placeholder="e.g. $200"
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Generate plan
        </button>
      </form>

      {plan && (
        <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              Summary
            </h2>
            <p className="mt-1 text-sm text-neutral-900">{plan.summary}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              Who it&apos;s for
            </h2>
            <p className="mt-1 text-sm text-neutral-900">{plan.customer}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              The problem it solves
            </h2>
            <p className="mt-1 text-sm text-neutral-900">{plan.problem}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              Pricing
            </h2>
            <p className="mt-1 text-sm text-neutral-900">{plan.pricing}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              Starting budget
            </h2>
            <p className="mt-1 text-sm text-neutral-900">{plan.budget}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-700">
              First steps
            </h2>
            <ol className="mt-1 flex list-decimal flex-col gap-1 pl-4 text-sm text-neutral-900">
              {plan.firstSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <p className="text-xs text-neutral-400">
        Informational only — not legal, tax, or financial advice. This early
        version drafts your plan from your own answers; a fuller
        AI-generated version is planned for later.
      </p>
    </div>
  );
}
