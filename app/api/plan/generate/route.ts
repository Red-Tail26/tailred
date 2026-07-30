import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type Intake = {
  idea: string;
  customer: string;
  problem: string;
  pricing: string;
  startupBudget: string;
};

const SYSTEM_PROMPT = `You write one-page business plans for solo side-hustlers and resellers who are just starting out — people running small operations like reselling clothes, sourcing goods, or offering a simple service. Keep it grounded and practical, never corporate or jargon-heavy. Assume the reader has little to no business background. This is informational only, not legal, tax, or financial advice, so don't give specific legal/tax numbers as fact.`;

const PLAN_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: { type: "string", description: "2-3 sentence overview of the business" },
    customer: { type: "string", description: "Who this is for, in plain language" },
    problem: { type: "string", description: "The problem this solves for that customer" },
    pricing: { type: "string", description: "A concrete, simple pricing approach" },
    budget: { type: "string", description: "Practical guidance on the stated starting budget" },
    firstSteps: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5,
      description: "Concrete, ordered first actions to take this week",
    },
  },
  required: ["summary", "customer", "problem", "pricing", "budget", "firstSteps"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI plan generation isn't configured yet." },
      { status: 503 }
    );
  }

  const intake = (await request.json()) as Intake;
  if (!intake.idea) {
    return NextResponse.json({ error: "Missing business idea." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: PLAN_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Write a one-page plan for this business:

Idea: ${intake.idea}
Who it's for: ${intake.customer || "not specified"}
Problem it solves: ${intake.problem || "not specified"}
Pricing approach: ${intake.pricing || "not specified"}
Starting budget: ${intake.startupBudget || "not specified"}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text in response");
    }

    const plan = JSON.parse(textBlock.text);
    return NextResponse.json(plan);
  } catch (err) {
    console.error("Plan generation failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate a plan right now." },
      { status: 502 }
    );
  }
}
