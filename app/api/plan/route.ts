import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/openai";
import { PLAN_SYSTEM_PROMPT } from "@/lib/prompts";
import type { FuellingPlan } from "@/lib/db";

// Force the Node runtime — the openai SDK uses APIs not present on Edge.
export const runtime = "nodejs";

interface PlanRequestBody {
  mode: "fresh" | "adjust";
  profile: unknown;
  foodPreferences: unknown;
  trainingWeek: unknown;
  previousFeedback?: string;
  baselinePlan?: unknown;
  carbTargetsGperKg?: { easy?: [number, number]; hard?: [number, number] };
  proteinTargetGperKg?: [number, number];
}

function isValidBody(body: unknown): body is PlanRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (b.mode !== "fresh" && b.mode !== "adjust") return false;
  if (!b.profile || !b.foodPreferences || !b.trainingWeek) return false;
  if (b.mode === "adjust" && !b.baselinePlan) return false;
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
      {
        error:
          "Invalid body. Required: mode ('fresh' | 'adjust'), profile, foodPreferences, trainingWeek. baselinePlan is required when mode is 'adjust'.",
      },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: OPENAI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
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

    let parsed: Partial<FuellingPlan>;
    try {
      parsed = JSON.parse(raw) as Partial<FuellingPlan>;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON.", raw },
        { status: 502 },
      );
    }

    // The client adds id, weekId, generatedAt before persisting to Dexie
    // (per SPEC §5.1: "Returns a structured FuellingPlan (without id/weekId
    // — client adds those)").
    return NextResponse.json(parsed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[/api/plan] OpenAI call failed:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Plan generation failed: ${message}` },
      { status: 502 },
    );
  }
}
