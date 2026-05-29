import type {
  Day,
  DayTotal,
  FuellingPlan,
  GroceryList,
  MealSlot,
  PlannedMeal,
} from "./db";

// PlannedMeal.food formatting rules — also applies to AI output in Phase 3
// (to be lifted into SPEC.md Appendix A when the prompt is wired up):
//
//   1. Commas only between ingredients. No "+", "w/", "&", "and", or mixed
//      connectors.                                  e.g. "Oats, banana, yoghurt"
//   2. Branded-item quantities use "× N" with the multiplication sign and
//      a leading space. Never parens, "x" or "*".   e.g. "Toast × 2", "Up&Go × 2"
//   3. Quantity of 1 → omit the multiplier.         e.g. "Rokeby" (not "Rokeby × 1")
//   4. "/" for substitution choices, no spaces.     e.g. "rice/pasta", "Rokeby/Up&Go"
//   5. Max 60 chars per food string. Shorten the ingredient list rather than
//      abbreviating words.
//
// "&" inside brand names is fine ("Up&Go") — the ban is only on "&" as an
// ingredient connector.

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: MealSlot[] = ["breakfast", "post_am", "lunch", "afternoon", "dinner"];

const SAMPLE: Record<MealSlot, Record<Day, Omit<PlannedMeal, "day" | "slot">>> = {
  breakfast: {
    Mon: { food: "Oats, banana, yoghurt, honey", note: "Normal portion", carbsG: 50, proteinG: 22 },
    Tue: { food: "Toast × 2, honey, banana", note: "Pre-interval fuel", carbsG: 60, proteinG: 7, isCritical: true },
    Wed: { food: "Oats, banana, maple, yoghurt", note: "Pre-long-run fuel", carbsG: 75, proteinG: 22, isCritical: true },
    Thu: { food: "Banana, toast, honey", note: "Pre-threshold fuel", carbsG: 55, proteinG: 5, isCritical: true },
    Fri: { food: "Oats, fruit, yoghurt", note: "Don't drop carbs", carbsG: 50, proteinG: 21 },
    Sat: { food: "Oats, fruit, yoghurt, nut butter", note: "Pre-load a touch for Sun", carbsG: 55, proteinG: 25 },
    Sun: { food: "Oats, banana, maple, yoghurt", note: "Pre-long-run fuel", carbsG: 75, proteinG: 22, isCritical: true },
  },
  post_am: {
    Mon: { food: "Rokeby/Up&Go", carbsG: 25, proteinG: 10 },
    Tue: { food: "Rokeby/Up&Go × 2", note: "Between-session refuel", carbsG: 50, proteinG: 20, isCritical: true },
    Wed: { food: "Rokeby/Up&Go × 2", note: "Long run depleted you", carbsG: 50, proteinG: 20, isCritical: true },
    Thu: { food: "Rokeby/Up&Go × 2", note: "Between-session refuel", carbsG: 50, proteinG: 20, isCritical: true },
    Fri: { food: "Rokeby/Up&Go", carbsG: 25, proteinG: 10 },
    Sat: { food: "Rokeby/Up&Go × 1–2", note: "Building toward Sun", carbsG: 35, proteinG: 15 },
    Sun: { food: "Rokeby/Up&Go × 2", note: "Long run depleted you", carbsG: 50, proteinG: 20, isCritical: true },
  },
  lunch: {
    Mon: { food: "Smoothie, toast, nut butter/eggs", carbsG: 60, proteinG: 35 },
    Tue: { food: "Smoothie, wrap/rice cakes, avocado/eggs", note: "Keep carbs flowing", carbsG: 70, proteinG: 40 },
    Wed: { food: "Smoothie, rice bowl/pasta", note: "Refuel + set up Thu", carbsG: 80, proteinG: 30 },
    Thu: { food: "Smoothie, rice, eggs/chicken", note: "Eat 2 hrs before PM run", carbsG: 75, proteinG: 60, isCritical: true },
    Fri: { food: "Smoothie, sandwich/wrap/eggs", note: "Supports PM run", carbsG: 60, proteinG: 40 },
    Sat: { food: "Smoothie, wrap/rice bowl", note: "Pre-loading Sun", carbsG: 70, proteinG: 30 },
    Sun: { food: "Smoothie, pasta/rice bowl, protein", note: "Full refuel meal", carbsG: 80, proteinG: 65 },
  },
  afternoon: {
    Mon: { food: "Fruit/toast, nuts/honey", note: "PM run top-up", carbsG: 25, proteinG: 5 },
    Tue: { food: "Banana, rice cakes, honey", note: "Top up before PM run", carbsG: 30, proteinG: 3 },
    Wed: { food: "Toast, nut butter, fruit", note: "Still eat — depleted", carbsG: 35, proteinG: 5 },
    Thu: { food: "Banana, rice cakes, honey", note: "Top up before PM", carbsG: 30, proteinG: 3 },
    Fri: { food: "Fruit/toast, yoghurt/honey", note: "Top up before PM run", carbsG: 25, proteinG: 5 },
    Sat: { food: "Fruit, crackers/rice cakes", note: "Stable, don't go light", carbsG: 30, proteinG: 3 },
    Sun: { food: "Toast/fruit, nut butter/yoghurt", note: "Still refuel", carbsG: 30, proteinG: 7 },
  },
  dinner: {
    Mon: { food: "Protein, rice/potatoes, veg", note: "Set up Tue intervals", carbsG: 70, proteinG: 35 },
    Tue: { food: "Protein, pasta/rice, veg", note: "Don't go light — two runs", carbsG: 75, proteinG: 35 },
    Wed: { food: "Protein, carbs, veg, fruit/dessert", note: "Fuels Thursday double", carbsG: 85, proteinG: 40, isCritical: true },
    Thu: { food: "Protein, carbs, veg", note: "Recover from threshold", carbsG: 75, proteinG: 35 },
    Fri: { food: "Protein, carbs, veg, good fats", note: "Supports sleep", carbsG: 65, proteinG: 35 },
    Sat: { food: "Rice/pasta, protein, veg", note: "Pre-load Sun long run", carbsG: 80, proteinG: 35, isCritical: true },
    Sun: { food: "Protein, carbs, veg, dessert", note: "Refuel + set up week", carbsG: 85, proteinG: 40 },
  },
};

const DAY_TOTALS: DayTotal[] = [
  { day: "Mon", carbsG: 230, proteinG: 107, tag: "easy" },
  { day: "Tue", carbsG: 285, proteinG: 105, tag: "hard" },
  { day: "Wed", carbsG: 325, proteinG: 117, tag: "long" },
  { day: "Thu", carbsG: 285, proteinG: 123, tag: "hard" },
  { day: "Fri", carbsG: 225, proteinG: 111, tag: "easy" },
  { day: "Sat", carbsG: 270, proteinG: 108, tag: "easy+" },
  { day: "Sun", carbsG: 320, proteinG: 154, tag: "long" },
];

export function mockPlan(weekId: string): FuellingPlan {
  const meals: PlannedMeal[] = [];
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      meals.push({ day, slot, ...SAMPLE[slot][day] });
    }
  }
  return {
    id: weekId,
    weekId,
    generatedAt: new Date().toISOString(),
    rules: [
      "Dodge the insulin dip — eat 0–20 min pre or > 2 hrs pre.",
      "Refuel within 30 min after AM sessions — carbs + protein, no exceptions.",
      "Eat for the work — don't drop carbs on easy days, and pre-load before long runs.",
    ],
    targets: { carbsRangeG: "190–325", proteinRangeG: "1.6–1.8 g/kg" },
    meals,
    dayTotals: DAY_TOTALS,
  };
}

export function mockGrocery(weekId: string): GroceryList {
  return {
    id: weekId,
    weekId,
    generatedAt: new Date().toISOString(),
    includeDinner: false,
    categories: [
      {
        name: "Carbs & Grains",
        items: [
          { id: "oats", name: "Rolled oats", qty: "500 g", note: "Breakfast Mon, Wed, Fri, Sat, Sun", checked: false },
          { id: "bread", name: "Bread loaf", qty: "1 large", note: "Toast + sandwiches", checked: false },
          { id: "wraps", name: "Wraps", qty: "1 pack", note: "Lunch Tue, Fri, Sat", checked: false },
          { id: "rice", name: "Rice (jasmine/basmati)", qty: "500 g", note: "Lunch Wed, Thu, Sat, Sun", checked: false },
          { id: "pasta", name: "Pasta", qty: "500 g", note: "Lunch Wed, Sun", checked: false },
          { id: "ricecakes", name: "Rice cakes", qty: "1 pack", note: "Lunch + afternoons", checked: false },
        ],
      },
      {
        name: "Protein Drinks",
        items: [
          { id: "upgo", name: "Up&Go Protein 250 ml", qty: "×10", note: "Daily post-AM; doubled Tue/Wed/Thu/Sun", checked: false },
          { id: "rokeby", name: "Rokeby Farms drink", qty: "×3", note: "Alternate for any post-AM", checked: false },
        ],
      },
      {
        name: "Fruit",
        items: [
          { id: "bananas", name: "Bananas", qty: "×10", note: "Breakfasts + afternoons + smoothies", checked: false },
          { id: "fruit", name: "Mixed fresh fruit", qty: "—", note: "Breakfast + afternoons", checked: false },
          { id: "berries", name: "Frozen berries", qty: "1 kg", note: "Daily smoothie", checked: false },
        ],
      },
      {
        name: "Dairy",
        items: [
          { id: "yoghurt", name: "Greek yoghurt", qty: "2 × 1 kg", note: "Smoothies + breakfasts", checked: false },
          { id: "milk", name: "Milk", qty: "2–3 L", note: "Smoothie base + oats", checked: false },
        ],
      },
      {
        name: "Eggs & Lean Protein",
        items: [
          { id: "eggs", name: "Eggs", qty: "1 dozen", note: "Lunch Mon, Tue, Thu, Fri", checked: false },
          { id: "chicken", name: "Chicken breast", qty: "~500 g", note: "Lunch Thu + Sun", checked: false },
          { id: "avocado", name: "Avocado", qty: "×2", note: "Lunch Tue", checked: false },
        ],
      },
      {
        name: "Spreads, Sweeteners & Extras",
        items: [
          { id: "honey", name: "Honey", qty: "1 jar", note: "Breakfasts + afternoon top-ups", checked: false },
          { id: "maple", name: "Maple syrup", qty: "1 small", note: "Breakfast Wed + Sun", checked: false },
          { id: "nutbutter", name: "Nut butter", qty: "1 jar", note: "Breakfast Sat, lunch Mon, afternoons", checked: false },
          { id: "nuts", name: "Mixed nuts", qty: "small bag", note: "Afternoon Mon", checked: false },
        ],
      },
    ],
    macroCheck: DAY_TOTALS,
    notes: [
      { label: "Note 01", text: "Up&Go 250 ml = ~18 g protein, ~21 g carbs. 500 ml = ~35 g / ~42 g — one bottle hits the hard-day target." },
      { label: "Note 02", text: "Buy plain Greek, not natural — ~10 g protein per 100 g vs half that in watery 'natural' tubs." },
      { label: "Note 03", text: "Batch-cook Sunday — rice + chicken + boil 6 eggs. Weekday lunches become 60 seconds of assembly." },
      { label: "Note 04", text: "Frozen > fresh berries for smoothies — cheaper, no waste, chills the drink." },
    ],
  };
}
