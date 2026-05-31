import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { loadRulesConfig, writeRulesConfigAndRegenerate } from "@/lib/rulesRegenerator";
import {
  RULE_SECTIONS,
  type NutritionRulesConfig,
} from "@/lib/nutritionRulesSchema";

export const runtime = "nodejs";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

// GET — return the full config (admin only).
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(loadRulesConfig());
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to read config: ${msg(e)}` },
      { status: 500 },
    );
  }
}

// PUT — update one section, validate, persist JSON, regenerate MD (admin only).
// Body: { section: RuleSection, value: <that section's shape> }.
export async function PUT(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vercel (and most hosts) mount a read-only filesystem in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Admin edits are disabled in production (read-only filesystem). Edit config/nutritionRules.json locally, regenerate, and redeploy.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const { section, value } = (body ?? {}) as { section?: unknown; value?: unknown };
  if (typeof section !== "string" || !(RULE_SECTIONS as readonly string[]).includes(section)) {
    return NextResponse.json(
      { error: `Unknown section: ${String(section)}` },
      { status: 400 },
    );
  }
  if (value === undefined) {
    return NextResponse.json({ error: "Missing 'value'." }, { status: 400 });
  }

  let current: NutritionRulesConfig;
  try {
    current = loadRulesConfig();
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to read config: ${msg(e)}` },
      { status: 500 },
    );
  }

  const updated = { ...current, [section]: value } as NutritionRulesConfig;
  const result = writeRulesConfigAndRegenerate(updated);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Validation failed.", details: result.errors },
      { status: 422 },
    );
  }
  return NextResponse.json(updated);
}
