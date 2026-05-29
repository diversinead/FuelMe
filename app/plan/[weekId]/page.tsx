"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Printer, RefreshCw, ShoppingBag } from "lucide-react";
import {
  getDb,
  type Day,
  type FuellingPlan,
  type MealSlot,
  type PlannedMeal,
} from "@/lib/db";
import { mockPlan } from "@/lib/mock";
import { formatWeekRange } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { MacroPill } from "@/components/shared/MacroPill";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: { slot: MealSlot; label: string; time: string }[] = [
  { slot: "breakfast", label: "Breakfast", time: "Pre-AM" },
  { slot: "post_am", label: "Post-AM", time: "Within 30 min" },
  { slot: "lunch", label: "Lunch", time: "12 – 1 pm" },
  { slot: "afternoon", label: "Afternoon", time: "Pre-PM run" },
  { slot: "dinner", label: "Dinner", time: "Post-PM" },
];

export default function PlanPage({ params }: { params: { weekId: string } }) {
  const { weekId } = params;

  const plan = useLiveQuery(
    async () => (await getDb().fuellingPlans.get(weekId)) ?? null,
    [weekId],
  );
  const [seeding, setSeeding] = React.useState(false);

  if (plan === undefined) return <Loading />;

  if (plan === null) {
    return (
      <main className="app-container py-12 max-w-2xl">
        <BackLink />
        <h1 className="font-display text-display-lg text-ink mt-6">
          No plan yet
        </h1>
        <p className="text-body-lg text-ink-secondary mt-3 mb-6">
          AI plan generation lands in Phase 3. For now, seed a mock plan to
          click through the flow.
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

  return <PlanView plan={plan} />;
}

function PlanView({ plan }: { plan: FuellingPlan }) {
  const [mobileDayIdx, setMobileDayIdx] = React.useState(0);
  const mealLookup = new Map<string, PlannedMeal>();
  for (const m of plan.meals) mealLookup.set(`${m.day}:${m.slot}`, m);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: ease.out }}
      className="app-container py-8 md:py-12"
    >
      <BackLink />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-6 mb-8">
        <div>
          <CardLabel>Week of {plan.weekId}</CardLabel>
          <h1 className="font-display text-display-xl text-ink mt-1 leading-none">
            Plan
          </h1>
          <p className="text-body-lg text-ink-secondary mt-2">
            {formatWeekRange(plan.weekId)} · Eat for the work.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/plan/${plan.weekId}/print?auto=1`} target="_blank">
            <Button variant="secondary">
              <Printer size={16} /> Print
            </Button>
          </Link>
          <Button variant="secondary" disabled>
            <RefreshCw size={16} /> Regenerate (Phase 3)
          </Button>
          <Link href={`/grocery/${plan.weekId}`}>
            <Button>
              <ShoppingBag size={16} /> Grocery
            </Button>
          </Link>
        </div>
      </header>

      {/* Targets + rules */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-6">
            <Target label="Carbs target" value={`${plan.targets.carbsRangeG} g`} />
            <Target label="Protein target" value={plan.targets.proteinRangeG} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.rules.map((r, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="font-mono text-mono-sm uppercase tracking-widest text-accent whitespace-nowrap pt-0.5">
                Rule {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-body-sm text-ink-secondary leading-snug">
                {r}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Mobile: day-by-day */}
      <div className="md:hidden">
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
          {SLOTS.map((row) => {
            const meal = mealLookup.get(`${DAYS[mobileDayIdx]}:${row.slot}`);
            return (
              <MealCard
                key={row.slot}
                slotLabel={row.label}
                time={row.time}
                meal={meal}
              />
            );
          })}
          <DayTotalRow
            total={plan.dayTotals.find((t) => t.day === DAYS[mobileDayIdx])}
          />
        </div>
      </div>

      {/* Desktop: weekly grid */}
      <div className="hidden md:block">
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="bg-surface-2 px-3 py-3 text-left w-28 border-b border-border-subtle"></th>
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className="bg-surface-2 text-left px-3 py-3 font-mono text-mono-sm uppercase tracking-widest text-ink-secondary border-b border-l border-border-subtle"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((row, ri) => (
                  <tr
                    key={row.slot}
                    className={cn(ri > 0 && "border-t border-border-subtle")}
                  >
                    <td className="bg-surface-2/40 px-3 py-3 align-top w-28 border-r border-border-subtle">
                      <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                        {row.label}
                      </div>
                      <div className="text-body-sm text-ink-secondary mt-1">
                        {row.time}
                      </div>
                    </td>
                    {DAYS.map((d) => {
                      const meal = mealLookup.get(`${d}:${row.slot}`);
                      return (
                        <td
                          key={d}
                          className={cn(
                            "align-top px-3 py-3 border-l border-border-subtle text-body-sm leading-snug",
                            meal?.isCritical &&
                              "border-l-2 border-l-accent",
                          )}
                        >
                          {meal ? (
                            <>
                              <div className="text-ink">{meal.food}</div>
                              {meal.note && (
                                <div className="text-body-sm text-ink-tertiary mt-1">
                                  {meal.note}
                                </div>
                              )}
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                <MacroPill kind="carbs" value={meal.carbsG} />
                                <MacroPill kind="protein" value={meal.proteinG} />
                              </div>
                            </>
                          ) : (
                            <span className="text-ink-tertiary">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Totals */}
                <tr className="border-t border-border">
                  <td className="bg-surface-2/40 px-3 py-3 border-r border-border-subtle">
                    <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
                      Day total
                    </div>
                  </td>
                  {DAYS.map((d) => {
                    const t = plan.dayTotals.find((x) => x.day === d);
                    return (
                      <td
                        key={d}
                        className="px-3 py-3 border-l border-border-subtle"
                      >
                        <div className="font-mono text-body text-ink">
                          {t?.carbsG ?? "—"}<span className="text-ink-tertiary"> g C</span>
                        </div>
                        <div className="font-mono text-body-sm text-accent mt-0.5">
                          {t?.proteinG ?? "—"}<span className="opacity-70"> g P</span>
                        </div>
                        <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary mt-1">
                          {t?.tag}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </motion.main>
  );
}

function Target({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
        {label}
      </div>
      <div className="font-mono text-display-sm text-ink mt-0.5">{value}</div>
    </div>
  );
}

function MealCard({
  slotLabel,
  time,
  meal,
}: {
  slotLabel: string;
  time: string;
  meal: PlannedMeal | undefined;
}) {
  return (
    <Card
      className={cn(
        "py-4 px-4",
        meal?.isCritical && "border-l-2 border-l-accent",
      )}
    >
      <div className="flex items-baseline justify-between">
        <CardLabel>{slotLabel}</CardLabel>
        <span className="font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          {time}
        </span>
      </div>
      {meal ? (
        <>
          <p className="text-body text-ink mt-2">{meal.food}</p>
          {meal.note && (
            <p className="text-body-sm text-ink-tertiary mt-1">{meal.note}</p>
          )}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <MacroPill kind="carbs" value={meal.carbsG} />
            <MacroPill kind="protein" value={meal.proteinG} />
          </div>
        </>
      ) : (
        <p className="text-ink-tertiary mt-2">—</p>
      )}
    </Card>
  );
}

function DayTotalRow({
  total,
}: {
  total: { day: Day; carbsG: number; proteinG: number; tag: string } | undefined;
}) {
  if (!total) return null;
  return (
    <Card className="bg-surface-2 py-4 px-4">
      <CardLabel>Day total</CardLabel>
      <div className="flex items-baseline gap-4 mt-2">
        <div>
          <div className="font-mono text-display-sm text-ink leading-none">
            {total.carbsG}
            <span className="text-ink-tertiary text-body-sm"> g C</span>
          </div>
        </div>
        <div>
          <div className="font-mono text-display-sm text-accent leading-none">
            {total.proteinG}
            <span className="opacity-70 text-body-sm"> g P</span>
          </div>
        </div>
        <span className="ml-auto font-mono text-mono-sm uppercase tracking-widest text-ink-tertiary">
          {total.tag}
        </span>
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
