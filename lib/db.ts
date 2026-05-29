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
  dietaryNotes?: string;
  allergies?: string;
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

export interface CheckIn {
  id: string; // == weekId
  weekId: string;
  submittedAt: string;
  mealCompletions: MealCompletion[];
  energyRating: 1 | 2 | 3 | 4 | 5;
  sessionsCompleted: number;
  freeNotes?: string;
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
