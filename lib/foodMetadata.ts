// ============================================================================
//  Food metadata table (SPEC §4.4.1 — hybrid grocery generation).
//
//  Maps a normalised ingredient token → its supermarket aisle, a typical
//  serving, and a realistic purchase pack size. The local grocery builder
//  (lib/grocery.ts) uses this to categorise + size known foods deterministically;
//  foods NOT in this table fall to the AI enrich step (or a fallback bucket).
//
//  Keyed lowercase. Seeded from foods seen in real generated plans + the
//  onboarding defaults; extend over time. NOTE: this never renames foods —
//  the grocery list shows the athlete's own plan vocabulary; this table only
//  supplies category/portion/packSize.
// ============================================================================

export type GroceryCategoryName =
  | "Carbs & Grains"
  | "Protein Drinks"
  | "Fruit"
  | "Dairy"
  | "Eggs & Lean Protein"
  | "Vegetables"
  | "Spreads & Extras";

export interface FoodMetadata {
  category: GroceryCategoryName;
  portion: string; // typical serving, e.g. "50g", "1", "250ml"
  unit: "g" | "count" | "ml";
  packSize?: number; // realistic purchase unit in the same unit (g/ml/count)
}

// Category render order for the grocery list.
export const GROCERY_CATEGORY_ORDER: GroceryCategoryName[] = [
  "Carbs & Grains",
  "Protein Drinks",
  "Fruit",
  "Dairy",
  "Eggs & Lean Protein",
  "Vegetables",
  "Spreads & Extras",
];

// Where unknown foods land if the AI enrich step is unavailable/declined.
export const FALLBACK_CATEGORY: GroceryCategoryName = "Spreads & Extras";

const C = "Carbs & Grains" as const;
const PD = "Protein Drinks" as const;
const F = "Fruit" as const;
const D = "Dairy" as const;
const E = "Eggs & Lean Protein" as const;
const V = "Vegetables" as const;
const S = "Spreads & Extras" as const;

export const FOOD_METADATA: Record<string, FoodMetadata> = {
  // --- Carbs & Grains ---
  oats: { category: C, portion: "60g", unit: "g", packSize: 1000 },
  "rolled oats": { category: C, portion: "60g", unit: "g", packSize: 1000 },
  porridge: { category: C, portion: "60g", unit: "g", packSize: 1000 },
  rice: { category: C, portion: "75g", unit: "g", packSize: 1000 },
  "brown rice": { category: C, portion: "75g", unit: "g", packSize: 1000 },
  "white rice": { category: C, portion: "75g", unit: "g", packSize: 1000 },
  pasta: { category: C, portion: "90g", unit: "g", packSize: 500 },
  noodles: { category: C, portion: "90g", unit: "g", packSize: 500 },
  potatoes: { category: C, portion: "250g", unit: "g", packSize: 2000 },
  potato: { category: C, portion: "250g", unit: "g", packSize: 2000 },
  "sweet potato": { category: C, portion: "250g", unit: "g", packSize: 1000 },
  quinoa: { category: C, portion: "75g", unit: "g", packSize: 500 },
  couscous: { category: C, portion: "75g", unit: "g", packSize: 500 },
  muesli: { category: C, portion: "60g", unit: "g", packSize: 750 },
  granola: { category: C, portion: "60g", unit: "g", packSize: 500 },
  cereal: { category: C, portion: "60g", unit: "g", packSize: 500 },
  toast: { category: C, portion: "1", unit: "count", packSize: 18 },
  bread: { category: C, portion: "1", unit: "count", packSize: 18 },
  sourdough: { category: C, portion: "1", unit: "count", packSize: 18 },
  bagel: { category: C, portion: "1", unit: "count" },
  wrap: { category: C, portion: "1", unit: "count", packSize: 6 },
  tortilla: { category: C, portion: "1", unit: "count", packSize: 6 },
  "rice cakes": { category: C, portion: "1", unit: "count" },
  crackers: { category: C, portion: "1", unit: "count" },

  // --- Protein Drinks ---
  "up&go": { category: PD, portion: "1", unit: "count" },
  upgo: { category: PD, portion: "1", unit: "count" },
  rokeby: { category: PD, portion: "1", unit: "count" },
  "rokeby farms": { category: PD, portion: "1", unit: "count" },
  "protein shake": { category: PD, portion: "1", unit: "count" },
  "protein drink": { category: PD, portion: "1", unit: "count" },
  "recovery drink": { category: PD, portion: "1", unit: "count" },
  "whey protein": { category: PD, portion: "30g", unit: "g", packSize: 1000 },
  "protein powder": { category: PD, portion: "30g", unit: "g", packSize: 1000 },

  // --- Fruit ---
  banana: { category: F, portion: "1", unit: "count" },
  bananas: { category: F, portion: "1", unit: "count" },
  apple: { category: F, portion: "1", unit: "count" },
  orange: { category: F, portion: "1", unit: "count" },
  kiwi: { category: F, portion: "1", unit: "count" },
  pear: { category: F, portion: "1", unit: "count" },
  mango: { category: F, portion: "1", unit: "count" },
  berries: { category: F, portion: "80g", unit: "g", packSize: 500 },
  blueberries: { category: F, portion: "80g", unit: "g", packSize: 500 },
  strawberries: { category: F, portion: "80g", unit: "g", packSize: 500 },
  grapes: { category: F, portion: "100g", unit: "g", packSize: 500 },
  avocado: { category: F, portion: "1", unit: "count" },
  dates: { category: F, portion: "30g", unit: "g", packSize: 250 },

  // --- Dairy ---
  yoghurt: { category: D, portion: "170g", unit: "g", packSize: 1000 },
  "greek yoghurt": { category: D, portion: "170g", unit: "g", packSize: 1000 },
  "cottage cheese": { category: D, portion: "100g", unit: "g", packSize: 500 },
  cheese: { category: D, portion: "30g", unit: "g", packSize: 250 },
  feta: { category: D, portion: "30g", unit: "g", packSize: 200 },
  milk: { category: D, portion: "250ml", unit: "ml", packSize: 2000 },

  // --- Eggs & Lean Protein ---
  egg: { category: E, portion: "2", unit: "count", packSize: 12 },
  eggs: { category: E, portion: "2", unit: "count", packSize: 12 },
  chicken: { category: E, portion: "150g", unit: "g", packSize: 500 },
  "chicken breast": { category: E, portion: "150g", unit: "g", packSize: 500 },
  beef: { category: E, portion: "150g", unit: "g", packSize: 500 },
  steak: { category: E, portion: "150g", unit: "g", packSize: 500 },
  mince: { category: E, portion: "150g", unit: "g", packSize: 500 },
  turkey: { category: E, portion: "150g", unit: "g", packSize: 500 },
  salmon: { category: E, portion: "150g", unit: "g", packSize: 500 },
  fish: { category: E, portion: "150g", unit: "g", packSize: 500 },
  tuna: { category: E, portion: "1", unit: "count" },
  tofu: { category: E, portion: "150g", unit: "g", packSize: 300 },
  tempeh: { category: E, portion: "150g", unit: "g", packSize: 300 },
  lentils: { category: E, portion: "1", unit: "count" },
  chickpeas: { category: E, portion: "1", unit: "count" },
  beans: { category: E, portion: "1", unit: "count" },
  ham: { category: E, portion: "40g", unit: "g", packSize: 200 },

  // --- Vegetables ---
  broccoli: { category: V, portion: "1", unit: "count" },
  spinach: { category: V, portion: "1", unit: "count" },
  kale: { category: V, portion: "1", unit: "count" },
  salad: { category: V, portion: "1", unit: "count" },
  carrots: { category: V, portion: "1", unit: "count" },
  carrot: { category: V, portion: "1", unit: "count" },
  zucchini: { category: V, portion: "1", unit: "count" },
  capsicum: { category: V, portion: "1", unit: "count" },
  tomato: { category: V, portion: "1", unit: "count" },
  tomatoes: { category: V, portion: "1", unit: "count" },
  cucumber: { category: V, portion: "1", unit: "count" },
  peas: { category: V, portion: "80g", unit: "g", packSize: 500 },
  corn: { category: V, portion: "1", unit: "count" },
  "mixed veg": { category: V, portion: "100g", unit: "g", packSize: 500 },
  vegetables: { category: V, portion: "100g", unit: "g", packSize: 500 },
  veg: { category: V, portion: "100g", unit: "g", packSize: 500 },

  // --- Spreads & Extras ---
  honey: { category: S, portion: "1", unit: "count" },
  jam: { category: S, portion: "1", unit: "count" },
  "nut butter": { category: S, portion: "1", unit: "count" },
  "peanut butter": { category: S, portion: "1", unit: "count" },
  "almond butter": { category: S, portion: "1", unit: "count" },
  "maple syrup": { category: S, portion: "1", unit: "count" },
  vegemite: { category: S, portion: "1", unit: "count" },
  "olive oil": { category: S, portion: "1", unit: "count" },
  oil: { category: S, portion: "1", unit: "count" },
  nuts: { category: S, portion: "30g", unit: "g", packSize: 250 },
  almonds: { category: S, portion: "30g", unit: "g", packSize: 250 },
  hummus: { category: S, portion: "1", unit: "count" },
};
