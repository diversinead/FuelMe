import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/openai";
import { PLAN_SYSTEM_PROMPT } from "@/lib/prompts";
import { criteriaForIds } from "@/lib/coachingCriteria";
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
  selectedCriteria?: string[];
}

// Build the system prompt, appending any user-selected coaching emphasis.
function buildSystemPrompt(selectedCriteria: string[] | undefined): string {
  const criteria = criteriaForIds(selectedCriteria);
  if (criteria.length === 0) return PLAN_SYSTEM_PROMPT;
  const lines = criteria
    .map((c) => `- ${c.label}: ${c.promptGuidance}`)
    .join("\n");
  return `${PLAN_SYSTEM_PROMPT}

# Additional emphasis this week (user-selected priorities)

Apply these on top of everything above. They are the athlete's explicit focus for this plan:
${lines}`;
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
    const selectedCriteria = (body as PlanRequestBody).selectedCriteria;
    const matchedCriteria = criteriaForIds(selectedCriteria).map((c) => c.id);

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: OPENAI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(selectedCriteria) },
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
    // — client adds those)"). Echo back the matched coaching criteria so the
    // client can store them on the plan record.
    return NextResponse.json({ ...parsed, appliedCriteria: matchedCriteria });
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
