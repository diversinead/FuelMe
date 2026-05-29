"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  getDb,
  type Day,
  type DaySession,
  type FuellingPlan,
  type MealSlot,
  type SessionType,
  type TrainingWeek,
} from "@/lib/db";
import { SESSION_LABELS } from "@/lib/defaults";
import { planPrintCss } from "@/styles/print-plan";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: "breakfast", label: "Breakfast" },
  { slot: "post_am",   label: "Post-AM" },
  { slot: "lunch",     label: "Lunch" },
  { slot: "afternoon", label: "Afternoon" },
  { slot: "dinner",    label: "Dinner" },
];

type PillVariant = "neutral" | "hard" | "long";

function pillVariantForType(type: SessionType | undefined): PillVariant {
  if (
    type === "intervals" ||
    type === "threshold" ||
    type === "tempo" ||
    type === "race"
  ) {
    return "hard";
  }
  if (type === "long") return "long";
  return "neutral"; // rest, easy, easy_double, cross
}

function pillLabelForDay(daySession: DaySession | undefined): string {
  if (!daySession) return "Rest";
  const subs = daySession.sessions ?? [];
  if (subs.length === 1 && subs[0].customType?.trim()) {
    return subs[0].customType.trim();
  }
  return SESSION_LABELS[daySession.type] ?? "Rest";
}

export default function PlanPrintPage({
  params,
}: {
  params: { weekId: string };
}) {
  const { weekId } = params;
  const searchParams = useSearchParams();
  const auto = searchParams?.get("auto") === "1";

  const data = useLiveQuery(async () => {
    const db = getDb();
    return {
      plan: (await db.fuellingPlans.get(weekId)) ?? null,
      training: (await db.trainingWeeks.get(weekId)) ?? null,
    };
  }, [weekId]);
  const plan = data?.plan;
  const training = data?.training ?? null;

  React.useEffect(() => {
    if (!auto || !plan) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [auto, plan]);

  if (plan === undefined) return null;

  if (plan === null) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: planPrintCss }} />
        <div className="sheet">
          <header>
            <div>
              <div className="meta">No plan for {weekId}</div>
              <h1>Nothing to print yet</h1>
            </div>
          </header>
          <div className="screen-toolbar">
            <Link href={`/plan/${weekId}`}>← Back to plan</Link>
            <span />
          </div>
        </div>
      </>
    );
  }

  return <PlanSheet plan={plan} training={training} />;
}

function PlanSheet({
  plan,
  training,
}: {
  plan: FuellingPlan;
  training: TrainingWeek | null;
}) {
  const mealMap = new Map(
    plan.meals.map((m) => [`${m.day}:${m.slot}`, m] as const),
  );
  const trainingByDay = new Map(
    (training?.sessions ?? []).map((s) => [s.day, s] as const),
  );
  const weekDate = format(parseISO(plan.weekId), "EEE d MMM");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: planPrintCss }} />
      <div className="sheet">
        <header>
          <div>
            <div className="meta">Week of {weekDate}</div>
            <h1>Fuelling plan</h1>
          </div>
          <div className="legend">
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "var(--macro-carbs)" }}
              />
              Carbs {plan.targets.carbsRangeG} g
            </span>
            <span className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "var(--macro-protein)" }}
              />
              Protein {plan.targets.proteinRangeG}
            </span>
          </div>
        </header>

        <div className="plan-grid">
          {/* corner */}
          <div className="corner-cell" />

          {/* day headers */}
          {DAYS.map((d) => {
            const session = trainingByDay.get(d);
            return (
              <div key={d} className="day-cell">
                <div className="day">{d.toUpperCase()}</div>
                <span
                  className={`session-pill ${pillVariantForType(session?.type)}`}
                >
                  {pillLabelForDay(session)}
                </span>
              </div>
            );
          })}

          {/* meal rows */}
          {SLOTS.map((row) => (
            <React.Fragment key={row.slot}>
              <div className="slot-label">{row.label}</div>
              {DAYS.map((d) => {
                const meal = mealMap.get(`${d}:${row.slot}`);
                return (
                  <div key={d} className="meal-cell">
                    {meal ? (
                      <>
                        <div className="meal-food">{meal.food}</div>
                        <div className="meal-macros">
                          <span className="macro-c">{meal.carbsG}</span>
                          <span className="macro-p">{meal.proteinG}</span>
                        </div>
                      </>
                    ) : (
                      <span className="meal-empty">—</span>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          {/* totals row */}
          <div className="total-label">Total</div>
          {DAYS.map((d) => {
            const t = plan.dayTotals.find((x) => x.day === d);
            return (
              <div key={d} className="total-cell">
                <span className="macro-c">{t?.carbsG ?? "—"}</span>
                <span className="macro-p">{t?.proteinG ?? "—"}</span>
              </div>
            );
          })}
        </div>

        {plan.rules.length > 0 && (
          <div className="rules">
            {plan.rules.map((rule, i) => (
              <div key={i}>
                <div className="rule-num">Rule {String(i + 1).padStart(2, "0")}</div>
                <div className="rule-text">{rule}</div>
              </div>
            ))}
          </div>
        )}

        <div className="screen-toolbar">
          <Link href={`/plan/${plan.weekId}`}>← Back to plan</Link>
        </div>
      </div>
    </>
  );
}
