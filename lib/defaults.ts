import type { DaySession, FoodPreferences, SessionType, SubSession } from "./db";

export const FOOD_SUGGESTIONS = {
  breakfastOptions: ["rolled oats", "toast", "Greek yoghurt", "banana", "muesli"],
  proteinSources: ["eggs", "chicken breast", "Greek yoghurt", "tofu", "tuna"],
  carbSources: ["rice", "pasta", "potatoes", "wraps", "rice cakes", "bread"],
  fruits: ["bananas", "berries", "apples", "oranges", "pears"],
  vegetables: ["spinach", "broccoli", "carrots", "capsicum", "tomato"],
  snacks: ["nuts", "rice cakes", "crackers", "muesli bar", "fruit"],
  drinks: ["Up&Go", "Rokeby Farms", "milk", "smoothie", "water"],
  avoid: [] as string[],
} satisfies Partial<Record<keyof FoodPreferences, string[]>>;

// Labels for every session type (used by SessionTag, etc.)
export const SESSION_LABELS: Record<SessionType, string> = {
  rest: "Rest",
  easy: "Easy",
  easy_double: "Easy double",
  intervals: "Intervals",
  threshold: "Threshold",
  tempo: "Tempo",
  long: "Long",
  race: "Race",
  cross: "Cross-train",
};

// Types selectable in the per-sub-session dropdown (no "easy_double" — use Add session instead)
export const SELECTABLE_SUB_SESSION_TYPES: SessionType[] = [
  "easy",
  "intervals",
  "threshold",
  "tempo",
  "long",
  "race",
  "cross",
];

// Intensity ordering — used to pick the "primary" type when a day has multiple sub-sessions.
const PRIORITY: Record<SessionType, number> = {
  rest: 0,
  cross: 1,
  easy: 2,
  easy_double: 2,
  tempo: 3,
  threshold: 4,
  intervals: 5,
  long: 6,
  race: 7,
};

function subSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function newSubSession(partial: Partial<SubSession> = {}): SubSession {
  return {
    id: subSessionId(),
    label: partial.label,
    type: partial.type ?? "easy",
    distanceKm: partial.distanceKm,
    durationMin: partial.durationMin,
  };
}

function fmtKm(km: number): string {
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

export function describeSub(s: SubSession): string {
  const parts: string[] = [];
  if (s.label?.trim()) parts.push(s.label.trim());
  parts.push(SESSION_LABELS[s.type]);
  if (s.distanceKm != null) parts.push(fmtKm(s.distanceKm));
  if (s.durationMin != null) parts.push(`${s.durationMin} min`);
  return parts.join(" ");
}

/** Derive top-level day fields from the sub-session list. */
export function deriveDayFields(sessions: SubSession[]): {
  type: SessionType;
  description: string;
  distanceKm?: number;
  durationMin?: number;
} {
  if (sessions.length === 0) {
    return { type: "rest", description: "Rest" };
  }
  if (sessions.length === 1) {
    const s = sessions[0];
    return {
      type: s.type,
      description: describeSub(s),
      distanceKm: s.distanceKm,
      durationMin: s.durationMin,
    };
  }
  const primary = [...sessions].sort(
    (a, b) => PRIORITY[b.type] - PRIORITY[a.type],
  )[0].type;
  const totalKm = sessions.reduce(
    (acc, s) => acc + (s.distanceKm ?? 0),
    0,
  );
  const totalMin = sessions.reduce(
    (acc, s) => acc + (s.durationMin ?? 0),
    0,
  );
  return {
    type: primary,
    description: sessions.map(describeSub).join(" · "),
    distanceKm: totalKm > 0 ? Math.round(totalKm * 10) / 10 : undefined,
    durationMin: totalMin > 0 ? totalMin : undefined,
  };
}

/** Rebuild a DaySession's derived fields from its sub-sessions. */
export function reconcileDaySession(day: DaySession): DaySession {
  const sessions = day.sessions ?? [];
  const derived = deriveDayFields(sessions);
  return { ...day, ...derived, sessions };
}

function single(
  day: DaySession["day"],
  label: string | undefined,
  type: SessionType,
  distanceKm?: number,
  durationMin?: number,
): DaySession {
  const sub = newSubSession({ label, type, distanceKm, durationMin });
  return reconcileDaySession({
    day,
    type,
    description: "",
    sessions: [sub],
  });
}

function multi(
  day: DaySession["day"],
  specs: Array<{
    label?: string;
    type: SessionType;
    distanceKm?: number;
    durationMin?: number;
  }>,
): DaySession {
  return reconcileDaySession({
    day,
    type: "easy",
    description: "",
    sessions: specs.map((s) => newSubSession(s)),
  });
}

function rest(day: DaySession["day"]): DaySession {
  return reconcileDaySession({
    day,
    type: "rest",
    description: "Rest",
    sessions: [],
  });
}

// Default distance/time assume ~6:00 /km easy pace, faster for work.
// Tweak freely — these are starting points, not gospel.
export const TRAINING_PRESETS: Record<string, DaySession[]> = {
  rest_week: [
    rest("Mon"),
    single("Tue", undefined, "easy", 5, 30),
    rest("Wed"),
    single("Thu", undefined, "easy", 5, 30),
    rest("Fri"),
    single("Sat", undefined, "easy", 8, 45),
    rest("Sun"),
  ],
  five_day_runner: [
    single("Mon", undefined, "easy", 8, 45),
    single("Tue", undefined, "intervals", 12, 60),
    rest("Wed"),
    single("Thu", undefined, "threshold", 10, 50),
    single("Fri", undefined, "easy", 5, 30),
    rest("Sat"),
    single("Sun", undefined, "long", 18, 100),
  ],
  marathon_block: [
    multi("Mon", [
      { label: "AM", type: "easy", distanceKm: 11, durationMin: 60 },
      { label: "PM", type: "easy", distanceKm: 6, durationMin: 35 },
    ]),
    multi("Tue", [
      { label: "AM", type: "intervals", distanceKm: 14, durationMin: 75 },
      { label: "PM", type: "easy", distanceKm: 6, durationMin: 35 },
    ]),
    single("Wed", undefined, "long", 14, 80),
    multi("Thu", [
      { label: "AM", type: "threshold", distanceKm: 12, durationMin: 60 },
      { label: "PM", type: "easy", distanceKm: 6, durationMin: 35 },
    ]),
    multi("Fri", [
      { label: "AM", type: "easy", distanceKm: 11, durationMin: 60 },
      { label: "PM", type: "easy", distanceKm: 6, durationMin: 35 },
    ]),
    multi("Sat", [
      { label: "AM", type: "easy", distanceKm: 11, durationMin: 60 },
      { label: "PM", type: "easy", distanceKm: 6, durationMin: 35 },
    ]),
    single("Sun", undefined, "long", 24, 140),
  ],
};

export const emptyWeekSessions: DaySession[] = (
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
).map((d) => rest(d));
