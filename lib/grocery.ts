// ============================================================================
//  Local grocery builder (SPEC §4.4.1 — hybrid generation).
//
//  Pure + deterministic (no fs, no network) so it runs anywhere. Parses the
//  plan's food strings, aggregates ingredients across the week, and uses
//  lib/foodMetadata.ts to categorise + size KNOWN foods. Foods not in the
//  table are returned as `unknowns` for the AI enrich step to categorise.
//
//  Names always preserve the athlete's own plan vocabulary ("oats" stays
//  "oats") — the metadata table only supplies category/portion/packSize.
// ============================================================================

import type {
  Day,
  DayTotal,
  FoodPreferences,
  FuellingPlan,
  GroceryCategory,
  GroceryItem,
  GroceryList,
  MealSlot,
  PlannedMeal,
} from "./db";
import {
  FOOD_METADATA,
  GROCERY_CATEGORY_ORDER,
  FALLBACK_CATEGORY,
  type FoodMetadata,
  type GroceryCategoryName,
} from "./foodMetadata";

export type GroceryListBody = Omit<GroceryList, "id" | "weekId" | "generatedAt">;

export interface UnknownFood {
  name: string;
  slug: string;
  qty: string;
  note: string;
}

export interface LocalGroceryResult {
  /** Known foods grouped into aisle categories (non-empty only). */
  categories: GroceryCategory[];
  /** Foods not in FOOD_METADATA — hand to the AI enrich step. */
  unknowns: UnknownFood[];
  macroCheck: DayTotal[];
}

const DAY_ORDER: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  post_am: "Post-AM",
  lunch: "Lunch",
  afternoon: "Afternoon",
  dinner: "Dinner",
};
const SLOT_ORDER: MealSlot[] = ["breakfast", "post_am", "lunch", "afternoon", "dinner"];

interface Agg {
  display: string;
  meta: FoodMetadata | null;
  servings: number;
  occurrences: { slot: MealSlot; day: Day }[];
}

const capitaliseFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
const trimNum = (x: number) => (Number.isInteger(x) ? `${x}` : x.toFixed(1));

function extractMultiplier(token: string): { name: string; mult: number } {
  const m = token.match(/[×x*]\s*(\d+)\s*$/);
  if (m && m.index !== undefined) {
    return { name: token.slice(0, m.index).trim(), mult: parseInt(m[1], 10) || 1 };
  }
  return { name: token.trim(), mult: 1 };
}

/** Metadata for a token: try the whole token, then its first substitution option. */
function lookup(name: string): FoodMetadata | null {
  const whole = name.toLowerCase().trim();
  if (FOOD_METADATA[whole]) return FOOD_METADATA[whole];
  const first = whole.split("/")[0].trim();
  return FOOD_METADATA[first] ?? null;
}

function parseAmount(portion: string): number {
  const m = portion.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 1;
}

function renderQty(meta: FoodMetadata, servings: number): string {
  const total = parseAmount(meta.portion) * servings;
  if (meta.unit === "count") return `×${Math.max(1, Math.round(total))}`;
  const step = meta.packSize ?? 250;
  const rounded = Math.max(step, Math.ceil(total / step) * step);
  if (meta.unit === "ml") {
    return rounded >= 1000 ? `${trimNum(rounded / 1000)} L` : `${rounded} ml`;
  }
  return rounded >= 1000 ? `${trimNum(rounded / 1000)} kg` : `${rounded} g`;
}

/** "Breakfast Mon, Wed; Dinner Tue" — falls back to a count if too long. */
function renderNote(occ: Agg["occurrences"]): string {
  const bySlot = new Map<MealSlot, Set<Day>>();
  for (const o of occ) {
    if (!bySlot.has(o.slot)) bySlot.set(o.slot, new Set());
    bySlot.get(o.slot)!.add(o.day);
  }
  const parts: string[] = [];
  for (const slot of SLOT_ORDER) {
    const days = bySlot.get(slot);
    if (!days) continue;
    parts.push(`${SLOT_LABEL[slot]} ${DAY_ORDER.filter((d) => days.has(d)).join(", ")}`);
  }
  const note = parts.join("; ");
  return note.length <= 60 ? note : `${occ.length} meals across the week`;
}

function avoidTokens(prefs: FoodPreferences): string[] {
  return prefs.avoid
    .flatMap((a) => a.toLowerCase().split(/[,/]/))
    .map((a) => a.trim())
    .filter(Boolean);
}

/** Parse + aggregate the plan into known categories + unknown foods. No network. */
export function buildLocalGroceryList(
  plan: FuellingPlan,
  prefs: FoodPreferences,
  includeDinner: boolean,
): LocalGroceryResult {
  const avoid = avoidTokens(prefs);
  const agg = new Map<string, Agg>();

  const meals: PlannedMeal[] = includeDinner
    ? plan.meals
    : plan.meals.filter((m) => m.slot !== "dinner");

  for (const meal of meals) {
    if (!meal.food?.trim()) continue;
    for (const rawPhrase of meal.food.split(",")) {
      const { name, mult } = extractMultiplier(rawPhrase.trim());
      if (!name) continue;
      const lower = name.toLowerCase();
      if (avoid.some((t) => t && lower.includes(t))) continue; // never surface avoided foods

      const key = lower;
      const existing = agg.get(key);
      if (existing) {
        existing.servings += mult;
        existing.occurrences.push({ slot: meal.slot, day: meal.day });
      } else {
        agg.set(key, {
          display: capitaliseFirst(name),
          meta: lookup(name),
          servings: mult,
          occurrences: [{ slot: meal.slot, day: meal.day }],
        });
      }
    }
  }

  const byCategory = new Map<GroceryCategoryName, GroceryItem[]>();
  const unknowns: UnknownFood[] = [];
  const usedSlugs = new Set<string>();
  const uniqueSlug = (name: string) => {
    let s = slugify(name);
    while (usedSlugs.has(s)) s = `${s}-x`;
    usedSlugs.add(s);
    return s;
  };

  for (const a of agg.values()) {
    const note = renderNote(a.occurrences);
    if (a.meta) {
      const item: GroceryItem = {
        id: uniqueSlug(a.display),
        name: a.display,
        qty: renderQty(a.meta, a.servings),
        note,
        checked: false,
      };
      if (!byCategory.has(a.meta.category)) byCategory.set(a.meta.category, []);
      byCategory.get(a.meta.category)!.push(item);
    } else {
      unknowns.push({
        name: a.display,
        slug: uniqueSlug(a.display),
        qty: `×${a.servings}`,
        note,
      });
    }
  }

  const categories: GroceryCategory[] = [];
  for (const cat of GROCERY_CATEGORY_ORDER) {
    const items = byCategory.get(cat);
    if (!items?.length) continue;
    items.sort((x, y) => x.name.localeCompare(y.name));
    categories.push({ name: cat, items });
  }

  return { categories, unknowns, macroCheck: plan.dayTotals };
}

// ---------------------------------------------------------------------------
// Assembly — fold AI enrich (or a deterministic fallback) into a full list
// ---------------------------------------------------------------------------

export interface GroceryEnrichment {
  /** lower-cased food name → category, for the unknowns. */
  categoryByName: Record<string, GroceryCategoryName>;
  notes: { label: string; text: string }[];
}

function fallbackNotes(plan: FuellingPlan): GroceryList["notes"] {
  const notes = [
    "Quantities are estimates from your plan — adjust to your appetite and pantry.",
    "Batch-cook rice, oats, or potatoes early in the week for grab-and-go training days.",
  ];
  const biggest = [...plan.dayTotals].sort((a, b) => b.carbsG - a.carbsG)[0];
  if (biggest) {
    notes.push(`Biggest fuelling day is ${biggest.day} (~${biggest.carbsG} g carbs) — stock carbs before it.`);
  }
  return notes.slice(0, 4).map((text, i) => ({ label: `Note ${String(i + 1).padStart(2, "0")}`, text }));
}

/**
 * Combine the local result with optional AI enrichment into a GroceryList body.
 * If `enrich` is null (AI unavailable/failed/declined), unknown foods drop to
 * the fallback aisle and notes are deterministic — the list still works.
 */
export function assembleGroceryList(
  plan: FuellingPlan,
  local: LocalGroceryResult,
  includeDinner: boolean,
  enrich: GroceryEnrichment | null,
): GroceryListBody {
  const byCategory = new Map<GroceryCategoryName, GroceryItem[]>();
  for (const c of local.categories) byCategory.set(c.name as GroceryCategoryName, [...c.items]);

  for (const u of local.unknowns) {
    const cat = enrich?.categoryByName[u.name.toLowerCase()] ?? FALLBACK_CATEGORY;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push({ id: u.slug, name: u.name, qty: u.qty, note: u.note, checked: false });
  }

  const categories: GroceryCategory[] = [];
  for (const cat of GROCERY_CATEGORY_ORDER) {
    const items = byCategory.get(cat);
    if (!items?.length) continue;
    items.sort((x, y) => x.name.localeCompare(y.name));
    categories.push({ name: cat, items });
  }

  return {
    includeDinner,
    categories,
    macroCheck: local.macroCheck,
    notes: enrich?.notes?.length ? enrich.notes.slice(0, 4) : fallbackNotes(plan),
  };
}
