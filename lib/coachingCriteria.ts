// Coaching criteria for the Regenerate dialog (see tasks/RegenerateDialog.md).
//
// Each criterion does two things when selected:
//   - `promptGuidance` is appended to the /api/plan system prompt to shape
//     generation (server-side, in app/api/plan/route.ts).
//   - `rule` is shown to the athlete on the plan view (CoachingRules), in
//     place of the old generic Rule 01/02/03 footer.
//
// Selection is ephemeral — never persisted as a preference. The ids that were
// active for a given plan are stored on FuellingPlan.appliedCriteria so the
// plan can render its coaching rules after the fact.

export interface CoachingCriterion {
  id: string; // stable key, used for storage and API
  label: string; // chip text
  rule: string; // displayed to user on plan when selected
  promptGuidance: string; // sent to AI to shape generation
}

export const COACHING_CRITERIA: CoachingCriterion[] = [
  {
    id: "insulin_dip",
    label: "Avoid the insulin dip",
    rule: "On key sessions, eat 0–20 min before OR more than 2 hours before. The 30–90 min gap is the trap.",
    promptGuidance:
      "For HARD, LONG, RACE days: structure pre-session meals so the user eats EITHER within 20 minutes of starting OR more than 2 hours before. Avoid recommending meals scheduled in the 30-90 minute pre-session window, which triggers reactive hypoglycemia mid-warmup.",
  },
  {
    id: "prebed_protein",
    label: "Pre-bed protein for recovery",
    rule: "Slow-digesting protein (Greek yoghurt, cottage cheese, casein) within 60 min of bed supports overnight muscle repair.",
    promptGuidance:
      "Add a pre-bed protein snack (W × 0.3 to W × 0.4 grams) within 60 min of bedtime, using slow-digesting sources like Greek yoghurt or cottage cheese. Add it as an additional meal slot or extend the dinner.",
  },
  {
    id: "carb_loading",
    label: "Carb load before race",
    rule: "In the 2–3 days before a race over 90 min, increase carbs to 10–12 g/kg/day, lower fibre, lower fat.",
    promptGuidance:
      "If RACE day appears in this week, apply carb loading: 2-3 days before the race, increase daily carbs to 10-12 g/kg, reduce fibre and fat, avoid new foods. Treat the day before race as a preload day with reduced fibre dinner.",
  },
  {
    id: "recovery_window",
    label: "30-min recovery window",
    rule: "After hard or long sessions, fast carbs (1.0–1.2 g/kg) and protein (0.3 g/kg) within 30 minutes.",
    promptGuidance:
      "After every HARD or LONG session, ensure the next meal slot delivers W × 1.0 to W × 1.2 grams of fast-digesting carbs PLUS W × 0.3 grams of fast-digesting protein, scheduled within 30 minutes of session end.",
  },
  {
    id: "preload_long",
    label: "Preload the day before long runs",
    rule: "The dinner before a long run is part of tomorrow's fuel. Larger carb portion, lower fibre, lower fat.",
    promptGuidance:
      "Identify days immediately before LONG, DOUBLE, or RACE sessions. For those days, add W × 1 to W × 2 extra grams of carbs at dinner, reduce fibre (avoid large salads, raw kale, broccoli), and lower fat content.",
  },
  {
    id: "protein_spread",
    label: "Spread protein across meals",
    rule: "Aim for 0.3–0.4 g/kg protein at each of 4–5 meals. Single big protein meals are less effective than distribution.",
    promptGuidance:
      "Distribute protein evenly across 4-5 meals daily, each meal in the W × 0.3 to W × 0.4 gram range. Never let a single meal exceed 0.4 g/kg of protein at the expense of others.",
  },
  {
    id: "hydration",
    label: "Hydration with electrolytes",
    rule: "Sessions over 60 min or in heat need electrolytes: 300–700 mg sodium per litre of fluid lost.",
    promptGuidance:
      "For any session over 60 min, include an electrolyte recommendation in the during-session or post-session note. Suggest commercial sports drinks or DIY (1/4 tsp salt + carb mix) at 300-700 mg sodium per litre of expected sweat loss.",
  },
  {
    id: "iron_focus",
    label: "Iron-rich foods",
    rule: "Pair iron sources (red meat, lentils, leafy greens) with vitamin C. Avoid coffee/tea within 1 hour of iron-rich meals.",
    promptGuidance:
      "Schedule iron-rich foods (red meat, liver, lentils, dark leafy greens, fortified cereals) at least 2-3 times this week. Pair plant-based iron with vitamin C sources (citrus, capsicum, tomato). Note to user: avoid coffee/tea within 1 hour of iron-rich meals.",
  },
];

/**
 * Resolve a list of criterion ids to their definitions, in canonical
 * (COACHING_CRITERIA) order. Unmatched ids are skipped silently — old plans
 * may reference criteria that were later removed (edge case §3 in the brief).
 */
export function criteriaForIds(ids: string[] | undefined): CoachingCriterion[] {
  if (!ids || ids.length === 0) return [];
  const wanted = new Set(ids);
  return COACHING_CRITERIA.filter((c) => wanted.has(c.id));
}
