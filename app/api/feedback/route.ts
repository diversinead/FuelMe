import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/openai";
import { FEEDBACK_SYSTEM_PROMPT } from "@/lib/prompts";
import type { AIFeedback } from "@/lib/db";

export const runtime = "nodejs";

interface FeedbackRequestBody {
  fuellingPlan: unknown;
  checkIn: unknown;
  profile: unknown;
}

function isValidBody(body: unknown): body is FeedbackRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.fuellingPlan || !b.checkIn || !b.profile) return false;
  return true;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Invalid body. Required: fuellingPlan, checkIn, profile." },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: OPENAI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(body) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Model returned an empty completion." },
        { status: 502 },
      );
    }

    let parsed: Partial<AIFeedback>;
    try {
      parsed = JSON.parse(raw) as Partial<AIFeedback>;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON.", raw },
        { status: 502 },
      );
    }

    // Client stamps generatedAt and merges into the CheckIn record.
    return NextResponse.json(parsed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[/api/feedback] OpenAI call failed:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Feedback generation failed: ${message}` },
      { status: 502 },
    );
  }
}
