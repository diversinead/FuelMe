// ============================================================================
//  Nutrition-rules config schema (Phase 7 — Admin page).
//
//  config/nutritionRules.json is the SOURCE OF TRUTH for nutrition logic.
//  NUTRITION_RULES.md and the prompt builders in lib/prompts.ts are GENERATED
//  from it (see lib/rulesRegenerator.ts and the /admin page).
//
//  Pure types + a dependency-free validator — no fs, safe to import anywhere.
// ============================================================================

/** Carb amount: either bodyweight-scaled (g/kg) or absolute grams. */
export type CarbAmount =
  | { type: "multiplier"; min: number; max: number }
  | { type: "absolute"; min: number; max: number; unit: "g" };

export type Range = [number, number];

export interface DayType {
  id: "REST" | "EASY" | "MODERATE" | "HARD" | "LONG" | "DOUBLE" | "RACE";
  label: string;
  description: string;
  multiplierMin: number;
  multiplierMax: number;
}

export interface NutritionRulesConfig {
  corePrinciples: string[];
  carbPeriodisation: {
    dayTypes: DayType[];
    preloadCarbsMin: number;
    preloadCarbsMax: number;
    minimumVarianceMultiplier: number;
    withinDayDistribution: {
      breakfastPct: Range;
      postAmRefuelPct: Range;
      lunchPct: Range;
      afternoonPct: Range;
      dinnerPct: Range;
      preBedPct: Range;
    };
  };
  protein: {
    profiles: Array<{
      id: string;
      label: string;
      multiplierMin: number;
      multiplierMax: number;
    }>;
    mastersAddition: Range;
    lutealAddition: Range;
    perMealMultiplierMin: number;
    perMealMultiplierMax: number;
    postSessionMultiplier: number;
    preBedMultiplierMin: number;
    preBedMultiplierMax: number;
  };
  hydration: {
    baselineMlPerKgMin: number;
    baselineMlPerKgMax: number;
    duringTrainingMlPerHrMin: number;
    duringTrainingMlPerHrMax: number;
    electrolyteThresholdMin: number;
    sodiumMgPerLitreMin: number;
    sodiumMgPerLitreMax: number;
  };
  timing: {
    preSession: Array<{
      hoursBeforeMin: number;
      hoursBeforeMax: number;
      carbs: CarbAmount;
      notes: string;
    }>;
    duringSession: Array<{
      durationMin: number;
      durationMax: number | null;
      carbsPerHourMin: number;
      carbsPerHourMax: number;
    }>;
    postSession: {
      windowMinutes: number;
      carbsMultiplierMin: number;
      carbsMultiplierMax: number;
      proteinMultiplier: number;
      fluidMlMin: number;
      fluidMlMax: number;
    };
  };
  sportOverlays: Record<string, { label: string; rules: string[] }>;
  femaleAthlete: {
    follicularPhase: { notes: string[] };
    lutealPhase: {
      carbsIncreasePct: Range;
      proteinAdditionGPerKg: Range;
      notes: string[];
    };
    menstruation: { notes: string[] };
    leaThresholdKcalPerKgFfm: number;
    ironFocus: {
      foods: string[];
      pairings: string[];
      avoidWithin1Hr: string[];
    };
    boneHealth: {
      calciumMgPerDayMin: number;
      calciumMgPerDayMax: number;
      vitDIuMin: number;
      vitDIuMax: number;
    };
  };
  dietaryPatterns: Record<
    string,
    {
      label: string;
      allowedFoods?: string[];
      avoidFoods: string[];
      specialNotes: string[];
    }
  >;
  raceDay: {
    carbLoadingDaysOut: Range;
    carbLoadingMultiplierMin: number;
    carbLoadingMultiplierMax: number;
    raceMorningHoursOut: Range;
    duringRace: Array<{
      durationMin: number;
      durationMax: number | null;
      carbsPerHourMin: number;
      carbsPerHourMax: number;
      notes: string;
    }>;
  };
  specialSituations: Record<string, { label: string; notes: string[] }>;
  hardConstraints: string[];
  formattingRules: {
    ingredientSeparator: string;
    quantityFormat: string;
    substitutionFormat: string;
    caseStyle: string;
    maxFoodStringLength: number;
    examples: Array<{ slot: string; example: string }>;
  };
}

// The section keys the admin UI edits and the PUT route accepts.
export const RULE_SECTIONS = [
  "corePrinciples",
  "carbPeriodisation",
  "protein",
  "hydration",
  "timing",
  "sportOverlays",
  "femaleAthlete",
  "dietaryPatterns",
  "raceDay",
  "specialSituations",
  "hardConstraints",
  "formattingRules",
] as const;
export type RuleSection = (typeof RULE_SECTIONS)[number];

// ---------------------------------------------------------------------------
// Validation — dependency-free. Returns a list of human-readable errors;
// empty array means valid. Thorough on the editable numeric/array shapes,
// pragmatic on deeply-nested prose.
// ---------------------------------------------------------------------------

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
function isStrArr(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === "string");
}
function isRange(v: unknown): v is Range {
  return Array.isArray(v) && v.length === 2 && isNum(v[0]) && isNum(v[1]);
}

function validateCarbAmount(v: unknown, path: string, errs: string[]) {
  if (!isObj(v)) {
    errs.push(`${path}: expected object`);
    return;
  }
  if (v.type === "multiplier") {
    if (!isNum(v.min) || !isNum(v.max))
      errs.push(`${path}: multiplier needs numeric min/max`);
  } else if (v.type === "absolute") {
    if (!isNum(v.min) || !isNum(v.max))
      errs.push(`${path}: absolute needs numeric min/max`);
    if (v.unit !== "g") errs.push(`${path}: absolute unit must be "g"`);
  } else {
    errs.push(`${path}: type must be "multiplier" or "absolute"`);
  }
}

/** Validate a full config. Returns [] when valid. */
export function validateNutritionRulesConfig(value: unknown): string[] {
  const e: string[] = [];
  if (!isObj(value)) return ["root: expected an object"];
  const c = value;

  if (!isStrArr(c.corePrinciples)) e.push("corePrinciples: expected string[]");
  if (!isStrArr(c.hardConstraints)) e.push("hardConstraints: expected string[]");

  // carbPeriodisation
  if (!isObj(c.carbPeriodisation)) {
    e.push("carbPeriodisation: expected object");
  } else {
    const cp = c.carbPeriodisation;
    if (!Array.isArray(cp.dayTypes)) {
      e.push("carbPeriodisation.dayTypes: expected array");
    } else {
      cp.dayTypes.forEach((d: unknown, i: number) => {
        if (!isObj(d) || typeof d.id !== "string" || typeof d.label !== "string")
          e.push(`carbPeriodisation.dayTypes[${i}]: needs id+label`);
        else if (!isNum(d.multiplierMin) || !isNum(d.multiplierMax))
          e.push(`carbPeriodisation.dayTypes[${i}]: numeric multiplierMin/Max`);
      });
    }
    if (!isNum(cp.preloadCarbsMin) || !isNum(cp.preloadCarbsMax))
      e.push("carbPeriodisation.preload*: numeric");
    if (!isNum(cp.minimumVarianceMultiplier))
      e.push("carbPeriodisation.minimumVarianceMultiplier: numeric");
    const d = (cp.withinDayDistribution ?? {}) as Record<string, unknown>;
    for (const k of ["breakfastPct", "postAmRefuelPct", "lunchPct", "afternoonPct", "dinnerPct", "preBedPct"])
      if (!isRange(d[k]))
        e.push(`carbPeriodisation.withinDayDistribution.${k}: expected [min,max]`);
  }

  // protein
  if (!isObj(c.protein)) {
    e.push("protein: expected object");
  } else {
    const p = c.protein;
    if (!Array.isArray(p.profiles)) e.push("protein.profiles: expected array");
    else
      p.profiles.forEach((pr: unknown, i: number) => {
        if (!isObj(pr) || typeof pr.id !== "string" || !isNum(pr.multiplierMin) || !isNum(pr.multiplierMax))
          e.push(`protein.profiles[${i}]: needs id + numeric multiplierMin/Max`);
      });
    if (!isRange(p.mastersAddition)) e.push("protein.mastersAddition: [min,max]");
    if (!isRange(p.lutealAddition)) e.push("protein.lutealAddition: [min,max]");
    for (const k of ["perMealMultiplierMin", "perMealMultiplierMax", "postSessionMultiplier", "preBedMultiplierMin", "preBedMultiplierMax"])
      if (!isNum((p as Record<string, unknown>)[k])) e.push(`protein.${k}: numeric`);
  }

  // hydration
  if (!isObj(c.hydration)) e.push("hydration: expected object");
  else
    for (const k of ["baselineMlPerKgMin", "baselineMlPerKgMax", "duringTrainingMlPerHrMin", "duringTrainingMlPerHrMax", "electrolyteThresholdMin", "sodiumMgPerLitreMin", "sodiumMgPerLitreMax"])
      if (!isNum((c.hydration as Record<string, unknown>)[k]))
        e.push(`hydration.${k}: numeric`);

  // timing
  if (!isObj(c.timing)) {
    e.push("timing: expected object");
  } else {
    const t = c.timing;
    if (!Array.isArray(t.preSession)) e.push("timing.preSession: expected array");
    else
      t.preSession.forEach((s: unknown, i: number) => {
        if (!isObj(s) || !isNum(s.hoursBeforeMin) || !isNum(s.hoursBeforeMax))
          e.push(`timing.preSession[${i}]: numeric hoursBefore`);
        validateCarbAmount(isObj(s) ? s.carbs : undefined, `timing.preSession[${i}].carbs`, e);
      });
    if (!Array.isArray(t.duringSession)) e.push("timing.duringSession: expected array");
    if (!isObj(t.postSession)) e.push("timing.postSession: expected object");
  }

  // record-shaped sections
  if (!isObj(c.sportOverlays)) e.push("sportOverlays: expected object map");
  if (!isObj(c.dietaryPatterns)) e.push("dietaryPatterns: expected object map");
  if (!isObj(c.specialSituations)) e.push("specialSituations: expected object map");
  if (!isObj(c.femaleAthlete)) e.push("femaleAthlete: expected object");

  // raceDay
  if (!isObj(c.raceDay)) {
    e.push("raceDay: expected object");
  } else {
    const r = c.raceDay;
    if (!isRange(r.carbLoadingDaysOut)) e.push("raceDay.carbLoadingDaysOut: [min,max]");
    if (!isRange(r.raceMorningHoursOut)) e.push("raceDay.raceMorningHoursOut: [min,max]");
    if (!isNum(r.carbLoadingMultiplierMin) || !isNum(r.carbLoadingMultiplierMax))
      e.push("raceDay.carbLoadingMultiplier*: numeric");
  }

  // formattingRules
  if (!isObj(c.formattingRules)) e.push("formattingRules: expected object");
  else if (!isNum((c.formattingRules as Record<string, unknown>).maxFoodStringLength))
    e.push("formattingRules.maxFoodStringLength: numeric");

  return e;
}
