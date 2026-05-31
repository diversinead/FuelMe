import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL, OPENAI_TEMPERATURE } from "@/lib/openai";
import { buildGrocerySystemPrompt } from "@/lib/prompts";
import {
  GROCERY_CATEGORY_ORDER,
  FALLBACK_CATEGORY,
  type GroceryCategoryName,
} from "@/lib/foodMetadata";

export const runtime = "nodejs";
export const maxDuration = 60;

// Enrich-only endpoint (SPEC §4.4.1 hybrid). The client builds + sizes the
// list locally and calls this only to categorise unknown foods and write
// coaching notes. Best-effort: the client falls back gracefully if this fails.
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_TOKENS = 1500;

interface EnrichBody {
  unknowns: string[];
  foodPreferences: unknown;
  dayTotals?: unknown;
  includeDinner?: boolean;
}

const VALID = new Set<string>(GROCERY_CATEGORY_ORDER);

function isValidBody(body: unknown): body is EnrichBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return Array.isArray(b.unknowns) && !!b.foodPreferences;
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
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Invalid body. Required: unknowns (string[]), foodPreferences." },
      { status: 400 },
    );
  }

  try {
    const completion = await openai.chat.completions.create(
      {
        model: OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildGrocerySystemPrompt() },
          { role: "user", content: JSON.stringify(body) },
        ],
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Model returned an empty completion." }, { status: 502 });
    }

    let parsed: { categoryByName?: unknown; notes?: unknown };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON.", raw }, { status: 502 });
    }

    // Coerce categories to the allowed set (lowercased keys); drop bad notes.
    const categoryByName: Record<string, GroceryCategoryName> = {};
    const rawCats = (parsed.categoryByName ?? {}) as Record<string, unknown>;
    for (const [name, cat] of Object.entries(rawCats)) {
      categoryByName[name.toLowerCase()] =
        typeof cat === "string" && VALID.has(cat)
          ? (cat as GroceryCategoryName)
          : FALLBACK_CATEGORY;
    }

    const notes = Array.isArray(parsed.notes)
      ? parsed.notes
          .filter(
            (n): n is { label: string; text: string } =>
              !!n && typeof (n as { text?: unknown }).text === "string",
          )
          .slice(0, 4)
          .map((n, i) => ({ label: n.label ?? `Note ${String(i + 1).padStart(2, "0")}`, text: n.text }))
      : [];

    return NextResponse.json({ categoryByName, notes });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[/api/grocery] enrich failed:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Grocery enrich failed: ${message}` }, { status: 502 });
  }
}
