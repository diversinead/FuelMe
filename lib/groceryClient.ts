// ============================================================================
//  Client-side grocery generation (SPEC §4.4.1 hybrid).
//
//  Builds the list locally from the plan (instant, offline, can't time out),
//  then best-effort calls /api/grocery to categorise unknown foods + write
//  coaching notes. If that fails or the user is offline, it assembles with a
//  graceful fallback and still saves a usable list. Client-only (Dexie).
// ============================================================================

import { getDb, type GroceryList } from "./db";
import {
  buildLocalGroceryList,
  assembleGroceryList,
  type GroceryEnrichment,
} from "./grocery";

const ENRICH_TIMEOUT_MS = 30_000;

/**
 * Generate this week's grocery list and persist it to Dexie.
 * Throws (with a user-facing message) only when the plan or food preferences
 * are missing — never for an AI/network failure.
 */
export async function generateGroceryList(
  weekId: string,
  includeDinner = true,
): Promise<void> {
  const db = getDb();
  const [plan, prefs] = await Promise.all([
    db.fuellingPlans.get(weekId),
    db.foodPreferences.get("me"),
  ]);
  if (!plan) {
    throw new Error(
      "No fuelling plan for this week yet. Generate a plan first, then come back.",
    );
  }
  if (!prefs) {
    throw new Error(
      "Missing food preferences. Re-run onboarding before generating a grocery list.",
    );
  }

  const local = buildLocalGroceryList(plan, prefs, includeDinner);

  // Best-effort AI enrich — unknown-food categories + coaching notes.
  let enrich: GroceryEnrichment | null = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ENRICH_TIMEOUT_MS);
    const res = await fetch("/api/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unknowns: local.unknowns.map((u) => u.name),
        foodPreferences: prefs,
        dayTotals: plan.dayTotals,
        includeDinner,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      enrich = (await res.json()) as GroceryEnrichment;
    }
  } catch {
    enrich = null; // graceful: local list still works
  }

  const body = assembleGroceryList(plan, local, includeDinner, enrich);
  const saved: GroceryList = {
    ...body,
    id: weekId,
    weekId,
    generatedAt: new Date().toISOString(),
  };
  await db.groceryLists.put(saved);
}
