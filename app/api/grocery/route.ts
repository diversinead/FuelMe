import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/openai";
import { buildGrocerySystemPrompt } from "@/lib/prompts";
import type { GroceryList } from "@/lib/db";

export const runtime = "nodejs";

// Give the platform headroom for the OpenAI call. Without this, some hosts
// (Vercel) cap serverless functions at ~10s and kill the request mid-generation.
// Per SPEC §4.4.1 build order (Phase 4 interim, before the hybrid refactor).
export const maxDuration = 60;

// Per-request bound on the OpenAI call. The SDK default is a 10-minute timeout,
// so a stalled generation hangs for the full 10 min before surfacing
// "Request timed out." — the bug this route was reported with. Capping the
// request at 50s (within the 60s function budget) surfaces a clear error
// quickly instead of hanging.
const GROCERY_REQUEST_TIMEOUT_MS = 50_000;

// A full week's grocery list fits comfortably under this. Bounding output tokens
// stops a runaway generation from being the thing that stalls the request.
const GROCERY_MAX_TOKENS = 4096;

interface GroceryRequestBody {
  fuellingPlan: unknown;
  foodPreferences: unknown;
  includeDinner: boolean;
}

function isValidBody(body: unknown): body is GroceryRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.fuellingPlan || !b.foodPreferences) return false;
  if (typeof b.includeDinner !== "boolean") return false;
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
          "Invalid body. Required: fuellingPlan, foodPreferences, includeDinner (boolean).",
      },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create(
      {
        model: OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        max_tokens: GROCERY_MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildGrocerySystemPrompt() },
          { role: "user", content: JSON.stringify(body) },
        ],
      },
      { timeout: GROCERY_REQUEST_TIMEOUT_MS },
    );

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Model returned an empty completion." },
        { status: 502 },
      );
    }

    let parsed: Partial<GroceryList>;
    try {
      parsed = JSON.parse(raw) as Partial<GroceryList>;
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON.", raw },
        { status: 502 },
      );
    }

    // The client adds id, weekId, generatedAt before persisting to Dexie.
    return NextResponse.json(parsed);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[/api/grocery] OpenAI call failed:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Grocery list generation failed: ${message}` },
      { status: 502 },
    );
  }
}
