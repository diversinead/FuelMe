import Dexie, { type Table } from "dexie";

// ---------- Profile ----------
export type Gender = "female" | "male" | "other" | "prefer_not";
export type Goal = "performance" | "maintenance" | "lean_out" | "gain";

export interface Profile {
  id: "me";
  name?: string;
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm?: number;
  goal: Goal;
  cycleTracking?: boolean;
}

// ---------- Food preferences ----------
export type Budget = "tight" | "moderate" | "generous";
export type CookingTime = "minimal" | "some" | "enjoy";

export interface FoodPreferences {
  id: "me";
  breakfastOptions: string[];
  proteinSources: string[];
  carbSources: string[];
  fruits: string[];
  vegetables: string[];
  snacks: string[];
  drinks: string[];
  avoid: string[];
  // Dietary constraints live here (with the other food info) rather than on
  // Profile — they're rules about what the athlete eats, not who they are.
  dietaryNotes?: string; // free text: "vegetarian", "no dairy", IBS-friendly…
  allergies?: string; // safety — never include these foods
  budget: Budget;
  cookingTime: CookingTime;
}

// ---------- Training week ----------
export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export type SessionType =
  | "rest"
  | "easy"
  | "easy_double"
  | "intervals"
  | "threshold"
  | "tempo"
  | "long"
  | "race"
  | "cross";

export interface SubSession {
  id: string;
  label?: string;          // e.g. "AM", "PM", "Track"
  type: SessionType;
  // True when the athlete hasn't picked a type yet (freshly added session).
  // `type` still carries a safe fallback ("easy") for derivation/AI, but the
  // form shows a blank field and chips show "Set type" rather than "Easy".
  // Undefined on existing/typed data — treated as typed.
  typeUnset?: boolean;
  customType?: string;     // free-text override (e.g. "Gym chest day"); takes precedence over type label
  distanceKm?: number;     // primary fuelling signal
  durationMin?: number;    // secondary context
}

export interface DaySession {
  day: Day;
  type: SessionType;       // derived from sessions[] (or single source for legacy data)
  description: string;     // derived for display
  distanceKm?: number;     // derived total
  durationMin?: number;    // derived total
  sessions?: SubSession[]; // source of truth for multi-session days
}

export interface TrainingWeek {
  id: string; // weekStart ISO (Monday)
  weekStart: string;
  sessions: DaySession[];
}

// ---------- Fuelling plan ----------
export type MealSlot =
  | "breakfast"
  | "post_am"
  | "lunch"
  | "afternoon"
  | "dinner";

export type DayTag = "easy" | "easy+" | "hard" | "long" | "rest";

export interface PlannedMeal {
  day: Day;
  slot: MealSlot;
  food: string;
  note?: string;
  carbsG: number;
  proteinG: number;
  isCritical?: boolean;
}

export interface DayTotal {
  day: Day;
  carbsG: number;
  proteinG: number;
  tag: DayTag;
}

export interface FuellingPlan {
  id: string; // == weekId
  weekId: string;
  generatedAt: string;
  rules: string[];
  targets: { carbsRangeG: string; proteinRangeG: string };
  meals: PlannedMeal[];
  dayTotals: DayTotal[];
  manuallyEdited?: boolean;
  // CoachingCriterion ids active when this plan was generated (Regenerate
  // dialog). Undefined on plans made before the feature; renders as no
  // coaching rules. Not an index — no schema migration needed.
  appliedCriteria?: string[];
}

// ---------- Grocery list ----------
export interface GroceryItem {
  id: string;
  name: string;
  qty: string;
  note?: string;
  checked: boolean;
}

export interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

export interface GroceryList {
  id: string;
  weekId: string;
  generatedAt: string;
  includeDinner: boolean;
  categories: GroceryCategory[];
  macroCheck: DayTotal[];
  notes: { label: string; text: string }[];
}

// ---------- Check-in ----------
export type CompletionStatus = "done" | "partial" | "missed" | "swapped";

export interface MealCompletion {
  day: string;
  slot: string;
  status: CompletionStatus;
  note?: string;
}

export interface AIFeedback {
  wins: string[];
  missed: string[];
  recommendations: string[];
  suggestedPlanEdits?: PlannedMeal[];
  generatedAt: string;
}

export type CheckInStatus = "draft" | "submitted";

export interface CheckIn {
  id: string; // == weekId
  weekId: string;
  submittedAt: string;
  mealCompletions: MealCompletion[];
  energyRating: 1 | 2 | 3 | 4 | 5;
  sessionsCompleted: number;
  freeNotes?: string;
  // 'draft' = in-progress, autosaved as the athlete logs through the week.
  // 'submitted' = finalised for AI feedback. Editing a submitted check-in
  // reverts it to 'draft' and clears aiFeedback (re-submit to refresh).
  status: CheckInStatus;
  aiFeedback?: AIFeedback;
}

// ---------- Dexie ----------
class FuelDB extends Dexie {
  profile!: Table<Profile, "me">;
  foodPreferences!: Table<FoodPreferences, "me">;
  trainingWeeks!: Table<TrainingWeek, string>;
  fuellingPlans!: Table<FuellingPlan, string>;
  groceryLists!: Table<GroceryList, string>;
  checkIns!: Table<CheckIn, string>;

  constructor() {
    super("fuel");
    this.version(1).stores({
      profile: "id",
      foodPreferences: "id",
      trainingWeeks: "id, weekStart",
      fuellingPlans: "id, weekId, generatedAt",
      groceryLists: "id, weekId, generatedAt",
      checkIns: "id, weekId, submittedAt",
    });

    // v2 — dietaryNotes + allergies moved from Profile to FoodPreferences.
    // Indexes are unchanged (these fields aren't indexed); the upgrade just
    // relocates existing data so nothing is lost.
    this.version(2)
      .stores({
        profile: "id",
        foodPreferences: "id",
        trainingWeeks: "id, weekStart",
        fuellingPlans: "id, weekId, generatedAt",
        groceryLists: "id, weekId, generatedAt",
        checkIns: "id, weekId, submittedAt",
      })
      .upgrade(async (tx) => {
        const profileTable = tx.table("profile");
        const prefsTable = tx.table("foodPreferences");
        const profile = (await profileTable.get("me")) as
          | (Record<string, unknown> & { id: "me" })
          | undefined;
        if (!profile) return;
        const dietaryNotes = profile.dietaryNotes as string | undefined;
        const allergies = profile.allergies as string | undefined;
        if (dietaryNotes === undefined && allergies === undefined) return;

        const prefs = (await prefsTable.get("me")) as
          | (Record<string, unknown> & { id: "me" })
          | undefined;
        if (prefs) {
          await prefsTable.put({
            ...prefs,
            // Keep any value already on prefs; otherwise take the profile's.
            dietaryNotes: prefs.dietaryNotes ?? dietaryNotes,
            allergies: prefs.allergies ?? allergies,
          });
          // Strip the relocated fields from the profile record.
          delete profile.dietaryNotes;
          delete profile.allergies;
          await profileTable.put(profile);
        }
        // If no prefs record exists, leave the fields on profile so the data
        // isn't lost (onboarding always writes both, so this is an edge case).
      });

    // v3 — CheckIn gains a draft/submitted status. Existing records were all
    // created by the old explicit-save flow, so they're treated as submitted.
    this.version(3)
      .stores({
        profile: "id",
        foodPreferences: "id",
        trainingWeeks: "id, weekStart",
        fuellingPlans: "id, weekId, generatedAt",
        groceryLists: "id, weekId, generatedAt",
        checkIns: "id, weekId, submittedAt",
      })
      .upgrade(async (tx) => {
        await tx
          .table("checkIns")
          .toCollection()
          .modify((c: Record<string, unknown>) => {
            if (c.status === undefined) c.status = "submitted";
          });
      });
  }
}

// Lazy singleton — Dexie only runs in browser context.
let _db: FuelDB | null = null;
export function getDb(): FuelDB {
  if (typeof window === "undefined") {
    throw new Error("Dexie is browser-only. Access getDb() inside a client component.");
  }
  if (!_db) _db = new FuelDB();
  return _db;
}

// ---------- Cloning helpers (Phase 4.5) ----------

/**
 * Duplicate the source week's FuellingPlan + TrainingWeek into the destination
 * week. Used by the §4.7 "Copy last week" chooser path. Each cloned record
 * gets the destination weekId; the FuellingPlan is stamped with the current
 * timestamp and `manuallyEdited: true` so downstream regenerate flows know
 * it's athlete-curated rather than AI-fresh.
 *
 * Returns which records were cloned so the caller can fall back to "Generate
 * fresh" if there's nothing to copy.
 */
export async function clonePlan(
  srcWeekId: string,
  destWeekId: string,
): Promise<{ clonedPlan: boolean; clonedTraining: boolean }> {
  const db = getDb();
  const [srcPlan, srcTraining] = await Promise.all([
    db.fuellingPlans.get(srcWeekId),
    db.trainingWeeks.get(srcWeekId),
  ]);

  const now = new Date().toISOString();
  let clonedPlan = false;
  let clonedTraining = false;

  if (srcPlan) {
    await db.fuellingPlans.put({
      ...srcPlan,
      id: destWeekId,
      weekId: destWeekId,
      generatedAt: now,
      manuallyEdited: true,
    });
    clonedPlan = true;
  }

  if (srcTraining) {
    await db.trainingWeeks.put({
      ...srcTraining,
      id: destWeekId,
      weekStart: destWeekId,
    });
    clonedTraining = true;
  }

  return { clonedPlan, clonedTraining };
}

const ALL_DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_SLOTS: MealSlot[] = [
  "breakfast",
  "post_am",
  "lunch",
  "afternoon",
  "dinner",
];

/**
 * A blank fuelling plan for a week — 35 empty meal cells + 7 zeroed day totals.
 * Used by the "Blank template" path (dashboard chooser / no-plan state): the
 * athlete lands on the plan page and fills it via the Regenerate dialog (the
 * one place AI generation happens, where focus notes are entered) or by hand.
 */
export function blankPlanRecord(weekId: string): FuellingPlan {
  const meals: PlannedMeal[] = ALL_DAYS.flatMap((day) =>
    ALL_SLOTS.map((slot) => ({
      day,
      slot,
      food: "",
      carbsG: 0,
      proteinG: 0,
    })),
  );
  const dayTotals: DayTotal[] = ALL_DAYS.map((day) => ({
    day,
    carbsG: 0,
    proteinG: 0,
    tag: "rest" as const,
  }));
  return {
    id: weekId,
    weekId,
    generatedAt: new Date().toISOString(),
    rules: [],
    targets: { carbsRangeG: "", proteinRangeG: "" },
    meals,
    dayTotals,
    manuallyEdited: true,
  };
}
