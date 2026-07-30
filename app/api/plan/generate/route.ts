import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

const SYSTEM_PROMPT = `You turn a solo side-hustler's own answers to ten business questions into a clear, organized one-page plan. You are NOT a general-purpose assistant — do not behave like a chatbot offering broad advice, market research, or ideas the user didn't give you.

Strict rules:
- Work ONLY from what the user wrote in each answer. Do not invent numbers, competitors, market size, strategies, or facts they did not provide.
- Your job is to sharpen, organize, and clarify their own words into plain, well-structured sentences — not to add new content, generic business tips, or textbook framing.
- If an answer is thin, vague, or missing, say so plainly in that section (e.g. "Not yet answered — worth thinking through before relying on this plan") rather than filling the gap with generic advice.
- No jargon, no "as a business owner you should..." lecturing, no invented statistics. Write like someone summarizing what they were just told, for the person who told them.
- Keep each section to 1-3 sentences.`;

const PLAN_SCHEMA = {
  type: "object" as const,
  properties: {
    problem: { type: "string", description: "Tightened restatement of the problem being solved, from the user's own answer only" },
    whoHasProblem: { type: "string", description: "Tightened restatement of who has this problem" },
    whyChooseYou: { type: "string", description: "Tightened restatement of why customers would choose this over alternatives" },
    opportunitySize: { type: "string", description: "Tightened restatement of how big the opportunity is, per the user" },
    revenueModel: { type: "string", description: "Tightened restatement of how the business makes money" },
    costs: { type: "string", description: "Tightened restatement of what it costs to operate" },
    customerAcquisition: { type: "string", description: "Tightened restatement of how customers will be found" },
    differentiation: { type: "string", description: "Tightened restatement of what makes this hard to replace" },
    profitabilityTimeline: { type: "string", description: "Tightened restatement of when this becomes profitable" },
    risks: { type: "string", description: "Tightened restatement of what assumptions could prove the user wrong" },
  },
  required: [
    "problem",
    "whoHasProblem",
    "whyChooseYou",
    "opportunitySize",
    "revenueModel",
    "costs",
    "customerAcquisition",
    "differentiation",
    "profitabilityTimeline",
    "risks",
  ],
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
  if (!intake.problem) {
    return NextResponse.json({ error: "Missing problem statement." }, { status: 400 });
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
          content: `Here are my answers to the ten questions. Organize and sharpen ONLY what I wrote below — do not add outside ideas or advice.

1. What problem am I solving? ${intake.problem || "(not answered)"}
2. Who has this problem? ${intake.whoHasProblem || "(not answered)"}
3. Why will they choose my solution? ${intake.whyChooseYou || "(not answered)"}
4. How big is the opportunity? ${intake.opportunitySize || "(not answered)"}
5. How will I make money? ${intake.revenueModel || "(not answered)"}
6. What will it cost to operate? ${intake.costs || "(not answered)"}
7. How will I find customers? ${intake.customerAcquisition || "(not answered)"}
8. What makes me difficult to replace? ${intake.differentiation || "(not answered)"}
9. When will I become profitable? ${intake.profitabilityTimeline || "(not answered)"}
10. What assumptions could prove me wrong? ${intake.risks || "(not answered)"}`,
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
