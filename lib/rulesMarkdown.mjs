// Pure markdown generator for NUTRITION_RULES.md (Phase 7).
//
// Plain JS (no `server-only`, no fs) so it can be imported by both the
// TypeScript app (lib/rulesRegenerator.ts) AND a plain-Node regenerate
// script (scripts/regenerate-rules.mjs) without a TS runner. Single source
// of truth for the template — no duplication.

export const GENERATED_BANNER =
  "<!-- This file is auto-generated from config/nutritionRules.json. Do not edit directly. -->";

const r = (min, max) => `${min}-${max}`;
const rng = (x) => `${x[0]}-${x[1]}`;
const bullets = (items) => items.map((s) => `- ${s}`).join("\n");
const carbAmt = (c) =>
  c.type === "multiplier"
    ? `${r(c.min, c.max)} g/kg carbs`
    : `${r(c.min, c.max)} ${c.unit} carbs`;
const dur = (min, max) => (max === null ? `${min}+ min` : `${min}-${max} min`);

const EXAMPLE_WEIGHTS = [55, 65, 75];

/** @param {import('./nutritionRulesSchema').NutritionRulesConfig} c */
export function regenerateNutritionRulesMarkdown(c) {
  const dayTypeRows = c.carbPeriodisation.dayTypes
    .map((d) => {
      const cols = EXAMPLE_WEIGHTS.map(
        (w) => `${Math.round(d.multiplierMin * w)}-${Math.round(d.multiplierMax * w)} g`,
      ).join(" | ");
      return `| ${d.id} | ${r(d.multiplierMin, d.multiplierMax)} | ${cols} |`;
    })
    .join("\n");

  const proteinRows = c.protein.profiles
    .map((p) => {
      const cols = EXAMPLE_WEIGHTS.map(
        (w) => `${Math.round(p.multiplierMin * w)}-${Math.round(p.multiplierMax * w)} g`,
      ).join(" | ");
      return `| ${p.label} | ${r(p.multiplierMin, p.multiplierMax)} | ${cols} |`;
    })
    .join("\n");

  const d = c.carbPeriodisation.withinDayDistribution;
  const duringRows = c.timing.duringSession
    .map((s) => `| ${dur(s.durationMin, s.durationMax)} | ${r(s.carbsPerHourMin, s.carbsPerHourMax)} g/hr |`)
    .join("\n");
  const raceRows = c.raceDay.duringRace
    .map((s) => `| ${dur(s.durationMin, s.durationMax)} | ${r(s.carbsPerHourMin, s.carbsPerHourMax)} g/hr | ${s.notes} |`)
    .join("\n");

  const overlays = Object.values(c.sportOverlays)
    .map((o) => `### ${o.label}\n\n${bullets(o.rules)}`)
    .join("\n\n");
  const dietary = Object.values(c.dietaryPatterns)
    .map((p) => {
      const allow = p.allowedFoods && p.allowedFoods.length ? `\n- Allowed: ${p.allowedFoods.join(", ")}` : "";
      return `### ${p.label}\n\n- Avoid: ${p.avoidFoods.join(", ")}${allow}\n${bullets(p.specialNotes)}`;
    })
    .join("\n\n");
  const special = Object.values(c.specialSituations)
    .map((s) => `### ${s.label}\n\n${bullets(s.notes)}`)
    .join("\n\n");

  const fr = c.formattingRules;
  const fmtExamples = fr.examples.map((ex) => `- ${ex.slot}: \`"${ex.example}"\``).join("\n");
  const fa = c.femaleAthlete;

  return `${GENERATED_BANNER}

# Nutrition Rules

**This file is generated from \`config/nutritionRules.json\`. Edit the rules through the \`/admin\` page (or the JSON directly), then regenerate — do not hand-edit this file.**

---

## 1. Core principles

${bullets(c.corePrinciples)}

---

## 2. Carbohydrate periodisation

Classify each day by its hardest session, then apply the per-day-type carb prescription. Daily carbs (g) = bodyweight (kg) × multiplier.

| Day type | Multiplier (g/kg) | ${EXAMPLE_WEIGHTS.map((w) => `${w} kg`).join(" | ")} |
|---|---|${EXAMPLE_WEIGHTS.map(() => "---").join("|")}|
${dayTypeRows}

**Preload rule:** if tomorrow is LONG, HARD, or RACE, add \`W × ${c.carbPeriodisation.preloadCarbsMin}\` to \`W × ${c.carbPeriodisation.preloadCarbsMax}\` g of extra carbs to today's dinner, reducing fibre and fat.

**Minimum-variance rule:** the highest-carb day must be at least \`W × ${c.carbPeriodisation.minimumVarianceMultiplier}\` g above the lowest-carb day.

**Within-day distribution (% of daily carbs):**

- Breakfast: ${rng(d.breakfastPct)}%
- Post-AM refuel: ${rng(d.postAmRefuelPct)}%
- Lunch: ${rng(d.lunchPct)}%
- Afternoon: ${rng(d.afternoonPct)}%
- Dinner: ${rng(d.dinnerPct)}%
- Optional pre-bed: ${rng(d.preBedPct)}%

---

## 3. Protein strategy

Daily protein (g) = bodyweight (kg) × multiplier.

| Athlete profile | Multiplier (g/kg) | ${EXAMPLE_WEIGHTS.map((w) => `${w} kg`).join(" | ")} |
|---|---|${EXAMPLE_WEIGHTS.map(() => "---").join("|")}|
${proteinRows}

- Masters athlete (40+): add ${rng(c.protein.mastersAddition)} g/kg.
- Female athlete in confirmed luteal phase: add ${rng(c.protein.lutealAddition)} g/kg.
- Per-meal dosing: \`W × ${c.protein.perMealMultiplierMin}\` to \`W × ${c.protein.perMealMultiplierMax}\` across 4-5 meals.
- Post-session: \`W × ${c.protein.postSessionMultiplier}\` fast-digesting protein.
- Pre-bed (heavy blocks): \`W × ${c.protein.preBedMultiplierMin}\` to \`W × ${c.protein.preBedMultiplierMax}\` slow-digesting protein.

---

## 4. Hydration & electrolytes

- Baseline: ${r(c.hydration.baselineMlPerKgMin, c.hydration.baselineMlPerKgMax)} ml/kg/day.
- Around training: add ${r(c.hydration.duringTrainingMlPerHrMin, c.hydration.duringTrainingMlPerHrMax)} ml per hour.
- Sessions over ${c.hydration.electrolyteThresholdMin} min (or in heat): add electrolytes — ${r(c.hydration.sodiumMgPerLitreMin, c.hydration.sodiumMgPerLitreMax)} mg sodium per litre of sweat lost.

---

## 5. Pre / intra / post-session fuelling

**Pre-session:**

${c.timing.preSession.map((s) => `- ${r(s.hoursBeforeMin, s.hoursBeforeMax)} h before: ${carbAmt(s.carbs)}. ${s.notes}`).join("\n")}

**During session:**

| Duration | Carbs per hour |
|---|---|
${duringRows}

**Post-session (within ${c.timing.postSession.windowMinutes} min of HARD/LONG):** ${r(c.timing.postSession.carbsMultiplierMin, c.timing.postSession.carbsMultiplierMax)} g/kg carbs + \`W × ${c.timing.postSession.proteinMultiplier}\` protein + ${r(c.timing.postSession.fluidMlMin, c.timing.postSession.fluidMlMax)} ml fluid.

---

## 6. Sport-specific overlays

${overlays}

---

## 7. Female athlete considerations

**Follicular phase:**

${bullets(fa.follicularPhase.notes)}

**Luteal phase:** increase carbs ${rng(fa.lutealPhase.carbsIncreasePct)}%, add ${rng(fa.lutealPhase.proteinAdditionGPerKg)} g/kg protein.

${bullets(fa.lutealPhase.notes)}

**Menstruation:**

${bullets(fa.menstruation.notes)}

**LEA threshold:** never below ${fa.leaThresholdKcalPerKgFfm} kcal/kg fat-free mass.

**Iron:** ${fa.ironFocus.foods.join(", ")}. Pair with ${fa.ironFocus.pairings.join(", ")}. Avoid ${fa.ironFocus.avoidWithin1Hr.join("/")} within 1 hour of iron-rich meals.

**Bone health:** calcium ${r(fa.boneHealth.calciumMgPerDayMin, fa.boneHealth.calciumMgPerDayMax)} mg/day; vitamin D ${r(fa.boneHealth.vitDIuMin, fa.boneHealth.vitDIuMax)} IU/day.

---

## 8. Dietary patterns

${dietary}

---

## 9. Race-day protocols

- Carb loading: ${rng(c.raceDay.carbLoadingDaysOut)} days out, ${r(c.raceDay.carbLoadingMultiplierMin, c.raceDay.carbLoadingMultiplierMax)} g/kg/day, reduce fibre and fat, no new foods.
- Race morning: ${rng(c.raceDay.raceMorningHoursOut)} h before — 1-4 g/kg carbs, low fibre, low fat, moderate protein.

**During the race:**

| Duration | Carbs per hour | Notes |
|---|---|---|
${raceRows}

---

## 10. Special situations

${special}

---

## 11. Hard constraints — never violate

${c.hardConstraints.map((h, i) => `${i + 1}. ${h}`).join("\n")}

---

## 12. Output formatting standards (food strings)

- Separator: ingredients joined by \`${fr.ingredientSeparator.trim() || ","}\`.
- Quantity: ${fr.quantityFormat}.
- Substitution: ${fr.substitutionFormat}.
- Case: ${fr.caseStyle}.
- Maximum ${fr.maxFoodStringLength} characters per food string.

Examples:

${fmtExamples}
`;
}
