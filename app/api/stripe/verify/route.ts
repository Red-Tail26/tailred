import { NextResponse } from "next/server";
import { verifyAndMarkPaid } from "@/lib/verifyPayment";

// Never statically prerendered — always needs a real request.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id." }, { status: 400 });
  }

  const result = await verifyAndMarkPaid(sessionId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
