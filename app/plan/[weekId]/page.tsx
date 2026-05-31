"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Printer, RefreshCw, ShoppingBag, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getDb,
  type Day,
  type DaySession,
  type DayTag,
  type FuellingPlan,
  type MealSlot,
  type PlannedMeal,
  type Profile,
  type SessionType,
  type TrainingWeek,
} from "@/lib/db";
import { mockPlan } from "@/lib/mock";
import {
  SESSION_LABELS,
  DEFAULT_CARB_TARGETS_G_PER_KG,
  DEFAULT_PROTEIN_TARGET_G_PER_KG,
} from "@/lib/defaults";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import { RegenerateDialog } from "@/components/plan/RegenerateDialog";
import { CoachingRules } from "@/components/plan/CoachingRules";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: "breakfast", label: "Breakfast" },
  { slot: "post_am",   label: "Post-AM" },
  { slot: "lunch",     label: "Lunch" },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "dinner",    label: "Dinner" },
];

type PillVariant = "neutral" | "hard" | "long" | "race";

// Pill variant from the actual SessionType (not the broad DayTotal.tag bucket).
function pillVariantForType(type: SessionType | undefined): PillVariant {
  if (type === "race") return "race"; // gold — distinct from hard red
  if (
    type === "intervals" ||
    type === "threshold" ||
    type === "tempo"
  ) {
    return "hard";
  }
  if (type === "long") return "long";
  return "neutral"; // rest, easy, easy_double, cross
}

// Pill label — prefers a sub-session's customType (e.g. "Gym") when there's
// only one session and it carries one, otherwise the preset SessionType label.
function pillLabelForDay(daySession: DaySession | undefined): string {
  if (!daySession) return "Rest";
  const subs = daySession.sessions ?? [];
  if (subs.length === 1 && subs[0].customType?.trim()) {
    return subs[0].customType.trim();
  }
  return SESSION_LABELS[daySession.type] ?? "Rest";
}

export default function PlanPage({ params }: { params: { weekId: string } }) {
  const { weekId } = params;
  const data = useLiveQuery(async () => {
    const db = getDb();
    const plan = (await db.fuellingPlans.get(weekId)) ?? null;
    const training = (await db.trainingWeeks.get(weekId)) ?? null;
    const profile = (await db.profile.get("me")) ?? null;
    return { plan, training, profile };
  }, [weekId]);
  const [seeding, setSeeding] = React.useState(false);

  if (data === undefined) return <Loading />;
  const { plan, training, profile } = data;

  if (plan === null) {
    return (
      <main className="app-container py-12 max-w-2xl">
        <BackLink />
        <h1 className="font-display text-display-lg text-ink mt-6">No plan yet</h1>
        <p className="text-body-lg text-ink-secondary mt-3 mb-6">
          AI plan generation lands in Phase 3. Seed a mock plan to click through.
        </p>
        <Button
          disabled={seeding}
          onClick={async () => {
            setSeeding(true);
            try {
              await getDb().fuellingPlans.put(mockPlan(weekId));
            } finally {
              setSeeding(false);
            }
          }}
        >
          {seeding ? "Seeding…" : "Seed mock plan"}
        </Button>
      </main>
    );
  }

  return <PlanView plan={plan} training={training} profile={profile} />;
}

function PlanView({
  plan,
  training,
  profile,
}: {
  plan: FuellingPlan;
  training: TrainingWeek | null;
  profile: Profile | null;
}) {
  const trainingByDay = new Map(
    (training?.sessions ?? []).map((s) => [s.day, s] as const),
  );

  const [mobileDayIdx, setMobileDayIdx] = React.useState(0);
  const [regenOpen, setRegenOpen] = React.useState(false);

  // Editable target bands — defaults from NUTRITION_RULES.md, overrideable
  // before regenerate. Not persisted; each page load resets to defaults.
  const [easyCarb, setEasyCarb] = React.useState<[number, number]>(
    DEFAULT_CARB_TARGETS_G_PER_KG.easy,
  );
  const [hardCarb, setHardCarb] = React.useState<[number, number]>(
    DEFAULT_CARB_TARGETS_G_PER_KG.hard,
  );
  const [proteinTarget, setProteinTarget] = React.useState<[number, number]>(
    DEFAULT_PROTEIN_TARGET_G_PER_KG,
  );
  const [editTargetsOpen, setEditTargetsOpen] = React.useState(false);
  const [groceryNavigating, setGroceryNavigating] = React.useState(false);
  const [groceryError, setGroceryError] = React.useState<string | null>(null);

  const router = useRouter();

  // Single-click "Grocery" flow from the plan:
  //  - no list yet            → generate, save, navigate
  //  - list older than plan   → regenerate (plan has changed), save, navigate
  //  - list newer than plan   → just navigate
  async function goToGrocery() {
    setGroceryNavigating(true);
    setGroceryError(null);
    try {
      const db = getDb();
      const existing = await db.groceryLists.get(plan.weekId);
      const isStale =
        !!existing && existing.generatedAt < plan.generatedAt;
      if (existing && !isStale) {
        router.push(`/grocery/${plan.weekId}`);
        return;
      }

      const foodPrefs = await db.foodPreferences.get("me");
      if (!foodPrefs) {
        throw new Error(
          "Missing food preferences. Re-run onboarding before generating a grocery list.",
        );
      }

      const response = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fuellingPlan: plan,
          foodPreferences: foodPrefs,
          includeDinner: true,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ??
            `Grocery list generation failed (HTTP ${response.status}).`,
        );
      }

      const apiList = (await response.json()) as Omit<
        import("@/lib/db").GroceryList,
        "id" | "weekId" | "generatedAt"
      >;

      await db.groceryLists.put({
        ...apiList,
        id: plan.weekId,
        weekId: plan.weekId,
        generatedAt: new Date().toISOString(),
      });

      router.push(`/grocery/${plan.weekId}`);
    } catch (e) {
      setGroceryError(
        e instanceof Error ? e.message : "Grocery list generation failed.",
      );
      setGroceryNavigating(false);
    }
  }
  const weightKg = profile?.weightKg ?? 0;
  const targetsAtDefault =
    easyCarb[0] === DEFAULT_CARB_TARGETS_G_PER_KG.easy[0] &&
    easyCarb[1] === DEFAULT_CARB_TARGETS_G_PER_KG.easy[1] &&
    hardCarb[0] === DEFAULT_CARB_TARGETS_G_PER_KG.hard[0] &&
    hardCarb[1] === DEFAULT_CARB_TARGETS_G_PER_KG.hard[1] &&
    proteinTarget[0] === DEFAULT_PROTEIN_TARGET_G_PER_KG[0] &&
    proteinTarget[1] === DEFAULT_PROTEIN_TARGET_G_PER_KG[1];

  function resetTargets() {
    setEasyCarb(DEFAULT_CARB_TARGETS_G_PER_KG.easy);
    setHardCarb(DEFAULT_CARB_TARGETS_G_PER_KG.hard);
    setProteinTarget(DEFAULT_PROTEIN_TARGET_G_PER_KG);
  }
  const [regenerating, setRegenerating] = React.useState(false);
  const [regenError, setRegenError] = React.useState<string | null>(null);

  // Meal-cell editing — modal opens when a cell is clicked. SPEC §4.3
  // calls for an anchored popover; a centered dialog gives the same
  // functional intent without the anchor-positioning gymnastics across
  // the 7-day grid (and naturally serves the mobile bottom-sheet brief).
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editFood, setEditFood] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editCarbs, setEditCarbs] = React.useState<number | undefined>(undefined);
  const [editProtein, setEditProtein] = React.useState<number | undefined>(undefined);
  const [editCritical, setEditCritical] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  const mealLookup = new Map<string, PlannedMeal>();
  for (const m of plan.meals) mealLookup.set(`${m.day}:${m.slot}`, m);

  const editingMeal = editingKey ? mealLookup.get(editingKey) : undefined;
  const editingDay = editingKey?.split(":")[0] as Day | undefined;
  const editingSlot = editingKey?.split(":")[1] as MealSlot | undefined;

  const weekDate = format(parseISO(plan.weekId), "EEE d MMM");

  function closeRegen() {
    if (regenerating) return;
    setRegenOpen(false);
    setRegenError(null);
  }

  function openEdit(day: Day, slot: MealSlot) {
    const key = `${day}:${slot}`;
    const meal = mealLookup.get(key);
    setEditingKey(key);
    setEditFood(meal?.food ?? "");
    setEditNote(meal?.note ?? "");
    setEditCarbs(meal?.carbsG);
    setEditProtein(meal?.proteinG);
    setEditCritical(meal?.isCritical ?? false);
    setEditError(null);
  }

  function closeEdit() {
    if (savingEdit) return;
    setEditingKey(null);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editingDay || !editingSlot) return;

    const food = editFood.trim();
    if (!food) {
      setEditError("Food can't be empty.");
      return;
    }
    if (food.length > 60) {
      setEditError("Food must be 60 characters or fewer.");
      return;
    }
    if (editCarbs === undefined || editProtein === undefined) {
      setEditError("Carbs and protein are required.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      const note = editNote.trim();

      // Propagation: when the user edits a meal's macros, any other meal
      // whose `food` string exactly matches the edited meal's NEW food
      // string also gets the new macros. The note and isCritical stay
      // per-meal — those are context-dependent — but the macros are a
      // property of the food itself.
      const propagationKeys = new Set<string>();
      plan.meals.forEach((m) => {
        if (m.day === editingDay && m.slot === editingSlot) return;
        if (m.food === food) propagationKeys.add(`${m.day}:${m.slot}`);
      });

      const meals: PlannedMeal[] = plan.meals.map((m) => {
        // The edited meal — full replacement.
        if (m.day === editingDay && m.slot === editingSlot) {
          return {
            ...m,
            food,
            note: note ? note : undefined,
            carbsG: editCarbs,
            proteinG: editProtein,
            isCritical: editCritical || undefined,
          };
        }
        // Other meals with matching food string — propagate macros only.
        if (propagationKeys.has(`${m.day}:${m.slot}`)) {
          return { ...m, carbsG: editCarbs, proteinG: editProtein };
        }
        return m;
      });

      // Recompute totals for every day that had a meal touched.
      const affectedDays = new Set<Day>([editingDay]);
      propagationKeys.forEach((key) => {
        affectedDays.add(key.split(":")[0] as Day);
      });

      const dayTotals = plan.dayTotals.map((t) => {
        if (!affectedDays.has(t.day)) return t;
        const dayCarbs = meals
          .filter((m) => m.day === t.day)
          .reduce((sum, m) => sum + (m.carbsG ?? 0), 0);
        const dayProtein = meals
          .filter((m) => m.day === t.day)
          .reduce((sum, m) => sum + (m.proteinG ?? 0), 0);
        return { ...t, carbsG: dayCarbs, proteinG: dayProtein };
      });

      const next: FuellingPlan = {
        ...plan,
        meals,
        dayTotals,
        manuallyEdited: true,
      };
      await getDb().fuellingPlans.put(next);

      setEditingKey(null);
    } catch (e) {
      setEditError(
        e instanceof Error ? e.message : "Couldn't save the meal.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // Esc to close whichever modal is open.
  React.useEffect(() => {
    if (!regenOpen && editingKey === null && !editTargetsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editingKey !== null) closeEdit();
      else if (editTargetsOpen) setEditTargetsOpen(false);
      else closeRegen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenOpen, regenerating, editingKey, savingEdit, editTargetsOpen]);

  async function handleRegenerate(selectedCriteria: string[]) {
    setRegenerating(true);
    setRegenError(null);
    try {
      const db = getDb();
      const [profile, foodPrefs, trainingWeek] = await Promise.all([
        db.profile.get("me"),
        db.foodPreferences.get("me"),
        db.trainingWeeks.get(plan.weekId),
      ]);

      if (!profile || !foodPrefs) {
        throw new Error(
          "Missing profile or food preferences. Re-run onboarding before regenerating.",
        );
      }
      if (!trainingWeek) {
        throw new Error(
          "Missing training week. Add this week's training in Settings before regenerating.",
        );
      }

      // Every regenerate is mode: "fresh". The targets band (Edit targets)
      // still flows through; selectedCriteria adds user-chosen AI emphasis.
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "fresh",
          profile,
          foodPreferences: foodPrefs,
          trainingWeek,
          carbTargetsGperKg: { easy: easyCarb, hard: hardCarb },
          proteinTargetGperKg: proteinTarget,
          selectedCriteria,
        }),
      });

      if (!response.ok) {
        const errBody = await response
          .json()
          .catch(() => ({} as { error?: string }));
        throw new Error(
          (errBody as { error?: string }).error ??
            `Plan generation failed (HTTP ${response.status}).`,
        );
      }

      const apiPlan = (await response.json()) as Omit<
        FuellingPlan,
        "id" | "weekId" | "generatedAt"
      >;

      const next: FuellingPlan = {
        ...apiPlan,
        id: plan.weekId,
        weekId: plan.weekId,
        generatedAt: new Date().toISOString(),
        manuallyEdited: false,
        // Trust the user's selection over the echoed response (brief §5).
        appliedCriteria: selectedCriteria,
      };
      await db.fuellingPlans.put(next);

      // Live query in PlanPage re-fires automatically.
      setRegenOpen(false);
    } catch (e) {
      setRegenError(
        e instanceof Error ? e.message : "Regeneration failed.",
      );
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12"
    >
      {/* Top utility row: back link only */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <BackLink />
      </div>

      {/* Header strip — title left, targets right. Buttons drop to the row below. */}
      <header className="mt-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
            Week of {weekDate}
          </div>
          <h1 className="text-[20px] font-medium text-ink mt-1 leading-none">
            Fuelling plan
          </h1>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-body-sm text-ink-secondary">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: "var(--macro-carbs)" }}
            />
            <span className="font-mono tabular-nums">
              Carbs {Math.round(easyCarb[0] * weightKg)}–
              {Math.round(hardCarb[1] * weightKg)} g
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: "var(--macro-protein)" }}
            />
            <span className="font-mono tabular-nums">
              Protein {Math.round(proteinTarget[0] * weightKg)}–
              {Math.round(proteinTarget[1] * weightKg)} g/day
            </span>
          </span>
          <button
            type="button"
            onClick={() => setEditTargetsOpen(true)}
            className="font-mono text-mono-sm uppercase tracking-widest text-accent hover:text-accent-hover"
          >
            Edit targets
          </button>
        </div>
      </header>

      {/* Action buttons — own row, right-aligned, sealed by the bottom border */}
      <div className="mt-3 pb-5 border-b-[0.5px] border-border-default flex justify-end gap-1.5 flex-wrap">
        <Link href={`/plan/${plan.weekId}/print?auto=1`} target="_blank">
          <Button variant="secondary" size="sm" className="h-7 px-2.5 text-mono-sm gap-1.5">
            <Printer size={12} /> Print
          </Button>
        </Link>
        <Button
          size="sm"
          onClick={() => setRegenOpen(true)}
          className="h-7 px-2.5 text-mono-sm gap-1.5"
        >
          <RefreshCw size={12} /> Regenerate
        </Button>
        <Button
          size="sm"
          onClick={goToGrocery}
          disabled={groceryNavigating}
          className="h-7 px-2.5 text-mono-sm gap-1.5"
        >
          <ShoppingBag size={12} />{" "}
          {groceryNavigating ? "Generating…" : "Grocery"}
        </Button>
      </div>

      {groceryError && (
        <div
          className="mt-3 p-3 rounded-button"
          style={{
            border:
              "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
            background: "color-mix(in srgb, var(--danger) 8%, transparent)",
          }}
        >
          <p className="text-body-sm text-danger leading-snug">
            {groceryError}
          </p>
        </div>
      )}

      {/* Mobile: day-by-day */}
      <div className="md:hidden mt-7">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-5 px-5">
          {DAYS.map((d, i) => (
            <button
              key={d}
              onClick={() => setMobileDayIdx(i)}
              className={cn(
                "shrink-0 px-3 py-2 rounded-button font-mono text-mono-sm uppercase tracking-widest border transition-colors",
                i === mobileDayIdx
                  ? "bg-accent text-ink-inverse border-accent"
                  : "bg-surface-2 text-ink-secondary border-border hover:text-ink",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {SLOTS.map((row) => (
            <MealCard
              key={row.slot}
              slotLabel={row.label}
              meal={mealLookup.get(`${DAYS[mobileDayIdx]}:${row.slot}`)}
              onClick={() => openEdit(DAYS[mobileDayIdx], row.slot)}
            />
          ))}
          <DayTotalRow
            total={plan.dayTotals.find((t) => t.day === DAYS[mobileDayIdx])}
          />
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:block mt-7">
        <div
          className="grid"
          style={{ gridTemplateColumns: "88px repeat(7, minmax(0, 1fr))" }}
        >
          {/* corner */}
          <div className="border-b-[0.5px] border-border-default" />

          {/* day headers */}
          {DAYS.map((d) => {
            const session = trainingByDay.get(d);
            return (
              <div
                key={d}
                className="px-3 pb-3 border-b-[0.5px] border-l-[0.5px] border-border-default"
              >
                <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  {d.toUpperCase()}
                </div>
                <div className="mt-1.5">
                  <SessionPill variant={pillVariantForType(session?.type)}>
                    {pillLabelForDay(session)}
                  </SessionPill>
                </div>
              </div>
            );
          })}

          {/* meal rows */}
          {SLOTS.map((row) => (
            <React.Fragment key={row.slot}>
              <div className="px-2 py-4 border-b-[0.5px] border-border-default flex items-start">
                <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                  {row.label}
                </span>
              </div>
              {DAYS.map((d) => {
                const meal = mealLookup.get(`${d}:${row.slot}`);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => openEdit(d, row.slot)}
                    aria-label={`Edit ${row.label} for ${d}`}
                    className={cn(
                      "px-3 py-4 border-b-[0.5px] border-l-[0.5px] border-border-default",
                      "flex flex-col justify-between min-h-[88px] text-left",
                      "hover:bg-surface-2 transition-colors duration-150",
                      "focus:outline-none focus-visible:bg-surface-2",
                    )}
                  >
                    {meal ? (
                      <>
                        <div className="text-[13px] text-ink leading-[1.45]">
                          {meal.food}
                        </div>
                        <div className="flex justify-end gap-2.5 mt-3 text-[11px] font-mono">
                          <span style={{ color: "var(--macro-carbs)" }}>
                            {meal.carbsG}
                          </span>
                          <span style={{ color: "var(--macro-protein)" }}>
                            {meal.proteinG}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-body-sm text-ink-tertiary">+</span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}

          {/* totals row */}
          <div className="px-2 py-4 flex items-center">
            <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
              Total
            </span>
          </div>
          {DAYS.map((d) => {
            const t = plan.dayTotals.find((x) => x.day === d);
            return (
              <div
                key={d}
                className="px-3 py-4 border-l-[0.5px] border-border-default flex justify-end items-center gap-2.5 text-[13px] font-medium font-mono"
              >
                <span style={{ color: "var(--macro-carbs)" }}>
                  {t?.carbsG ?? "—"}
                </span>
                <span style={{ color: "var(--macro-protein)" }}>
                  {t?.proteinG ?? "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Coaching rules — only when criteria were applied at regenerate. */}
        <CoachingRules criteriaIds={plan.appliedCriteria} />
      </div>

      {/* Regenerate dialog — coaching-criteria chips (tasks/RegenerateDialog.md) */}
      <RegenerateDialog
        open={regenOpen}
        generating={regenerating}
        error={regenError}
        onGenerate={handleRegenerate}
        onClose={closeRegen}
      />

      {/* Edit targets modal */}
      <AnimatePresence>
        {editTargetsOpen && (
          <motion.div
            key="edit-targets-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setEditTargetsOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-targets-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.18, ease: ease.out }}
              className="relative w-full max-w-md rounded-card bg-surface-1 border border-border p-6 shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2
                    id="edit-targets-title"
                    className="font-display text-display-sm text-ink"
                  >
                    Edit targets
                  </h2>
                  <p className="text-body-sm text-ink-secondary mt-1">
                    g/kg ranges by day type. Used on the next regenerate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditTargetsOpen(false)}
                  aria-label="Close"
                  className="shrink-0 -mt-1 -mr-1 p-1 text-ink-tertiary hover:text-ink rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Carbs */}
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span
                      aria-hidden
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: "var(--macro-carbs)" }}
                    />
                    <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                      Carbs
                    </span>
                  </div>
                  <div className="space-y-2">
                    <SubTarget
                      label="Easy"
                      range={easyCarb}
                      onChange={setEasyCarb}
                      step={0.5}
                      weightKg={weightKg}
                    />
                    <SubTarget
                      label="Hard"
                      range={hardCarb}
                      onChange={setHardCarb}
                      step={0.5}
                      weightKg={weightKg}
                    />
                  </div>
                </div>

                {/* Protein */}
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span
                      aria-hidden
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: "var(--macro-protein)" }}
                    />
                    <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                      Protein
                    </span>
                  </div>
                  <SubTarget
                    range={proteinTarget}
                    onChange={setProteinTarget}
                    step={0.1}
                    weightKg={weightKg}
                    gramSuffix="g/day"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-2">
                {!targetsAtDefault ? (
                  <button
                    type="button"
                    onClick={resetTargets}
                    className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
                  >
                    Reset to defaults
                  </button>
                ) : (
                  <span />
                )}
                <Button
                  size="sm"
                  onClick={() => setEditTargetsOpen(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline meal-cell editor */}
      <AnimatePresence>
        {editingKey !== null && editingDay && editingSlot && (
          <motion.div
            key="edit-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={closeEdit}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ duration: 0.18, ease: ease.out }}
              className="relative w-full max-w-md rounded-card bg-surface-1 border border-border p-6 shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                    {editingDay} · {SLOTS.find((s) => s.slot === editingSlot)?.label}
                  </div>
                  <h2
                    id="edit-title"
                    className="font-display text-display-sm text-ink mt-1"
                  >
                    {editingMeal ? "Edit meal" : "Add meal"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={savingEdit}
                  aria-label="Close"
                  className="shrink-0 -mt-1 -mr-1 p-1 text-ink-tertiary hover:text-ink rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="edit-food">Food</Label>
                  <Input
                    id="edit-food"
                    value={editFood}
                    onChange={(e) => setEditFood(e.target.value)}
                    placeholder="Oats, banana, yoghurt, honey"
                    maxLength={60}
                    autoFocus
                  />
                  <p className="text-body-sm text-ink-tertiary mt-1 leading-snug">
                    {editFood.length}/60 — commas between ingredients,
                    &ldquo;× N&rdquo; for branded quantities, &ldquo;/&rdquo;
                    for substitutions.
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-note">Note (optional)</Label>
                  <Input
                    id="edit-note"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Pre-long-run fuel"
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-carbs">Carbs (g)</Label>
                    <NumberInput
                      id="edit-carbs"
                      value={editCarbs}
                      onChange={(n) => setEditCarbs(n)}
                      min={0}
                      max={500}
                      step={5}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-protein">Protein (g)</Label>
                    <NumberInput
                      id="edit-protein"
                      value={editProtein}
                      onChange={(n) => setEditProtein(n)}
                      min={0}
                      max={200}
                      step={5}
                      placeholder="20"
                    />
                  </div>
                </div>

                {(() => {
                  const trimmed = editFood.trim();
                  if (!trimmed) return null;
                  const count = plan.meals.filter(
                    (m) =>
                      m.food === trimmed &&
                      !(m.day === editingDay && m.slot === editingSlot),
                  ).length;
                  if (count === 0) return null;
                  return (
                    <p className="text-body-sm text-ink-tertiary italic leading-snug">
                      These macros will also apply to {count} other meal
                      {count === 1 ? "" : "s"} with{" "}
                      <span className="text-ink">&ldquo;{trimmed}&rdquo;</span>{" "}
                      in this plan. Day totals will update accordingly.
                    </p>
                  );
                })()}

                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="pt-0.5">
                    <Checkbox
                      checked={editCritical}
                      onCheckedChange={(c) => setEditCritical(c)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-body text-ink">Mark as critical</div>
                    <p className="text-body-sm text-ink-tertiary mt-0.5 leading-snug">
                      Pre/post hard or long sessions, pre-load dinners. Used
                      by the AI in future regenerates.
                    </p>
                  </div>
                </label>
              </div>

              {editError && (
                <div
                  className="mt-4 p-3 rounded-button"
                  style={{
                    border:
                      "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                    background:
                      "color-mix(in srgb, var(--danger) 8%, transparent)",
                  }}
                >
                  <p className="text-body-sm text-danger leading-snug">
                    {editError}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={closeEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function GroupLabel({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    // Fixed width so "Carbs" and "Protein" leading sections occupy the same
    // horizontal slot — keeps the first input field aligned between rows.
    <span className="inline-flex items-center gap-2 whitespace-nowrap w-[80px]">
      <span
        aria-hidden
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        {children}
      </span>
    </span>
  );
}

function SubTarget({
  label,
  range,
  onChange,
  step,
  weightKg,
  gramSuffix = "g",
}: {
  label?: string;
  range: [number, number];
  onChange: (r: [number, number]) => void;
  step: number;
  weightKg: number;
  gramSuffix?: string;
}) {
  const lowG = Math.round(range[0] * weightKg);
  const highG = Math.round(range[1] * weightKg);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {/* Always rendered — empty span on the protein row keeps the input
          fields directly under the carb row's Easy inputs. */}
      <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-secondary w-[36px]">
        {label ?? ""}
      </span>
      <input
        type="number"
        step={step}
        min={0}
        value={range[0]}
        onChange={(e) => onChange([Number(e.target.value), range[1]])}
        className="w-11 bg-surface-2 border border-border rounded px-1 py-0 text-center font-mono text-[11px] leading-5 focus:border-accent focus:outline-none"
      />
      <span className="text-ink-tertiary">–</span>
      <input
        type="number"
        step={step}
        min={0}
        value={range[1]}
        onChange={(e) => onChange([range[0], Number(e.target.value)])}
        className="w-11 bg-surface-2 border border-border rounded px-1 py-0 text-center font-mono text-[11px] leading-5 focus:border-accent focus:outline-none"
      />
      <span className="text-ink-tertiary text-[11px]">g/kg</span>
      <span className="font-mono text-[11px] text-ink-secondary tabular-nums">
        {lowG}–{highG} {gramSuffix}
      </span>
    </span>
  );
}

function LegendDot({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

function SessionPill({
  variant,
  children,
}: {
  variant: PillVariant;
  children: React.ReactNode;
}) {
  const styles: Record<PillVariant, React.CSSProperties> = {
    neutral: {
      background: "var(--session-pill-neutral-bg)",
      color: "var(--session-pill-neutral-fg)",
    },
    hard: {
      background: "var(--session-pill-hard-bg)",
      color: "var(--session-pill-hard-fg)",
    },
    long: {
      background: "var(--session-pill-long-bg)",
      color: "var(--session-pill-long-fg)",
    },
    race: {
      background: "var(--session-pill-race-bg)",
      color: "var(--session-pill-race-fg)",
    },
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider"
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

function MealCard({
  slotLabel,
  meal,
  onClick,
}: {
  slotLabel: string;
  meal: PlannedMeal | undefined;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${slotLabel}`}
      className="w-full text-left rounded-card border border-border bg-surface-1 py-4 px-4 hover:border-border-strong transition-colors duration-150 focus:outline-none focus-visible:border-accent"
    >
      <CardLabel>{slotLabel}</CardLabel>
      {meal ? (
        <>
          <p className="text-[14px] text-ink mt-2 leading-[1.45]">{meal.food}</p>
          <div className="flex justify-end gap-3 mt-3 text-[12px] font-mono">
            <span style={{ color: "var(--macro-carbs)" }}>{meal.carbsG}</span>
            <span style={{ color: "var(--macro-protein)" }}>{meal.proteinG}</span>
          </div>
        </>
      ) : (
        <p className="text-ink-tertiary mt-2">+</p>
      )}
    </button>
  );
}

function DayTotalRow({
  total,
}: {
  total: { day: Day; carbsG: number; proteinG: number; tag: DayTag } | undefined;
}) {
  if (!total) return null;
  return (
    <Card className="bg-surface-2 py-3 px-4">
      <div className="flex items-center justify-between">
        <CardLabel>Total</CardLabel>
        <div className="flex gap-4 text-body font-mono font-medium">
          <span style={{ color: "var(--macro-carbs)" }}>{total.carbsG}</span>
          <span style={{ color: "var(--macro-protein)" }}>{total.proteinG}</span>
        </div>
      </div>
    </Card>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary hover:text-ink"
    >
      <ArrowLeft size={12} /> Dashboard
    </Link>
  );
}

function Loading() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <p className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        Loading…
      </p>
    </main>
  );
}
